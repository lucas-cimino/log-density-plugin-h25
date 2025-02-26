const vscode = require('vscode');
const path = require('path');
const { analyzeFiles } = require('../services/analyzeProject');
const { readFile } = require('../utils/fileReader');
const { runModel } = require('../services/runModelService');
const { createApiModel, createResponse } = require('../services/factoryService');
const { buildPrompt, getSurroundingMethodText, extractAttributesFromPrompt } = require("../utils/modelTools");
const { configuration } = require('../model_config');
const { generateLogAdviceForDocument } = require('../services/logAdviceService');
const { api_id, url, port, prompt_file, default_model, default_token, llm_temperature, llm_max_token, response_id, attributes_to_comment, comment_string, injection_variable } = configuration;


class AnalyzeFileProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.analyzeList = new Map();
        this.remoteUrl = '';
        this.javaFileProvider = null;
        this.apiModelService = createApiModel(api_id, url, port, default_model, default_token);
    }

    refresh() {
        this._onDidChangeTreeData.fire();
    }

    setRemoteUrl(url) {
        this.remoteUrl = url;
        console.log(`Remote URL updated to: ${url}`)
        console.log(`this.remoteUrl is set to: ${this.remoteUrl}`)
    }

    setJavaFileProvider(javaFileProvider) {
        this.javaFileProvider = javaFileProvider;
    }

    addFileToAnalyze(javaItem) {
        if (!this.analyzeList.has(javaItem.filepath)) {
            this.analyzeList.set(javaItem.filepath, javaItem);
            this.refresh();
        } else {
            console.log(`File already in list: ${javaItem.filepath}`);
        }
    }

    removeFileFromAnalyze(filePath) {
        if (this.analyzeList.has(filePath)) {
            this.analyzeList.delete(filePath);
            this.refresh();
        } else {
            console.log('File not found in the list:', filePath);
        }
    }
    
    removeAllFiles() {
        this.analyzeList.clear();
        this.refresh();
        console.log(`Removed all files to analyze: ${this.analyzeList.size} files in map.`)
    }
    
    getTreeItem(element) {
        return element;
    }

    getChildren(element) {
        if (!element) {
            return [...this.analyzeList.values()].map(javaItem => {
                const treeItem = new vscode.TreeItem(path.basename(javaItem.filepath), vscode.TreeItemCollapsibleState.None);
                treeItem.command = {
                    command: 'analyzeFileProvider.removeFile',
                    title: "Remove File",
                    arguments: [javaItem.filepath]  
                };
                treeItem.contextValue = 'analyzableFile';
                treeItem.iconPath = vscode.ThemeIcon.File;
                return treeItem;
            });
        }
        return [];
    }

    async sendFilesForAnalysis() {
        const fileContents = await Promise.all([...this.analyzeList.values()].map(async javaItem => {
            try {
                const content = await readFile(javaItem.filepath);
                return {
                    url: javaItem.filepath,
                    content: content
                };
            } catch (error) {
                console.error(`Error processing file ${javaItem.filepath}: ${error}`);
                throw error;
            }
        }));

        try {
            if (!this.remoteUrl) {
                vscode.window.showErrorMessage('Remote URL is not set.');
                return;
            }

            const results = await analyzeFiles(this.remoteUrl, fileContents);
            this.javaFileProvider.updateJavaFiles(results);
            vscode.window.showInformationMessage('Files successfully sent for analysis.');
            return results;
        } catch (error) {
            vscode.window.showErrorMessage('Failed to send files for analysis: ' + error.message);
        }
    }

    async getBlocks() {
        const results = await this.sendFilesForAnalysis();
        //TODO : do the opposite filter to only keep ones with higher density than predicted and ask it to remove logs
        //Filter files to only keep those with a lower density than predicted
        const filteredFiles = results.filter(f => f.density < f.predictedDensity);

        const allBlocks = await Promise.all(filteredFiles.map(async (element) => {
            const fileContent = await readFile(element.url);
            const result = await runModel(this.remoteUrl, fileContent);

            //Filter blocks to only keep those with a lower log level than predicted
            const filtered = result.blocks.filter(block => block.currentLogLevel < block.log_level);
            return { filePath: element.url, fileContent, blocks: filtered };
        }));

        const test = allBlocks.filter(b => b.blocks.length > 0);
        return allBlocks.filter(b => b.blocks.length > 0);
    }
    
    async processAllBlocks(allBlocks) {
        for (const fileInfo of allBlocks) {
            const document = await vscode.workspace.openTextDocument(fileInfo.filePath);
    
            for (const block of fileInfo.blocks) {
                const cursorLine = block.blockLineStart; 
    
                await generateLogAdviceForDocument(
                    document,
                    cursorLine
                );
            }
        }
    }
}

function registerAnalyzeFileProvider(context) {
    const analyzeFileProvider = new AnalyzeFileProvider();
    context.subscriptions.push(vscode.window.createTreeView('analyzeFilesView', {
        treeDataProvider: analyzeFileProvider
    }));

    context.subscriptions.push(vscode.commands.registerCommand('analyzeFileProvider.removeAllFiles', () => {
        analyzeFileProvider.removeAllFiles();
    }));

    context.subscriptions.push(vscode.commands.registerCommand('analyzeFileProvider.removeFile', (filePath) => {
        if (!filePath) {
            vscode.window.showErrorMessage('File path not provided or incorrect.');
            return;
        }
        console.log("Removing file at path:", filePath.command.arguments[0]); // first element in the argument is the file
        analyzeFileProvider.removeFileFromAnalyze(filePath.command.arguments[0]);
    }));

    context.subscriptions.push(vscode.commands.registerCommand('analyzeFileProvider.sendForAnalysis', async () => {
        const results = await analyzeFileProvider.sendFilesForAnalysis();
        vscode.window.showInformationMessage('Files sent for analysis. Check the console for details.');
        console.log(results);
    }));

    context.subscriptions.push(vscode.commands.registerCommand('analyzeFileProvider.analyzeAndAddMissingLogs', async () => {
        const blocks = await analyzeFileProvider.getBlocks();
        await analyzeFileProvider.processAllBlocks(blocks);
    }));
    
    return analyzeFileProvider;  
}

module.exports = {
    registerAnalyzeFileProvider
};