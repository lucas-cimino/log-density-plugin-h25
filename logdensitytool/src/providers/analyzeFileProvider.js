const vscode = require('vscode');
const path = require('path');
const { analyzeFiles } = require('../services/analyzeProject');
const { readFile } = require('../utils/fileReader');
const { runModel } = require('../services/runModelService');
const { createApiModel, createResponse } = require('../services/factoryService');
const { buildPrompt, getSurroundingMethodText, extractAttributesFromPrompt } = require("../utils/modelTools");
const { configuration } = require('../model_config');
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
        
        const allBlocks = await Promise.all(results.map(async (element) => {
            const fileContent = await readFile(element.url);
            const result = await runModel(this.remoteUrl, fileContent);
            return { filePath: element.url, fileContent, blocks: result.blocks };
        }));

        return allBlocks;
    }

    async sendBlocksToLLM(blocks) {
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Sending blocks to LLM",
            cancellable: false
        }, async (progress) => {
            progress.report({ message: "Contacting LLM..." });

            try {
                const model = await this.apiModelService.getModel();

                const projectBasePath = path.resolve(__dirname, "..", "..", "..");
                let system_prompt = await readFile(path.join(projectBasePath, "prompt", "add_missing_logs.txt"))

                let attributes = []
                if (system_prompt.includes("{{") && system_prompt.includes("}}")) {
                    attributes = extractAttributesFromPrompt(system_prompt, attributes_to_comment)
                    system_prompt = system_prompt.replace("{{", "{");
                    system_prompt = system_prompt.replace("}}", "}");
                }
                
                const builtPrompt = buildPrompt(JSON.stringify(blocks), system_prompt, "blocks");

                console.log("Prompt : " + JSON.stringify(builtPrompt));
                
                const modelResponse = await this.apiModelService.generate(model, null, builtPrompt, llm_temperature, llm_max_token);

                console.log("Reponse From LLM : " + modelResponse);

                // let linesToInsert = [];
                // while (linesToInsert.length === 0) {
                //     console.log("Generating log advice...");
                    
                //     const modelResponse = await apiModelService.generate(model, null, builtPrompt, llm_temperature, llm_max_token);
                    
                //     if (attributes.length > 0) {
                //         linesToInsert = reponseService.extractLines(modelResponse, attributes, attributes_to_comment, comment_string);
                //     } else {
                //         const standardResponse = createResponse(StandardResponse.responseId)
                //         linesToInsert = standardResponse.extractLines(modelResponse, attributes, attributes_to_comment, comment_string);
                //     }
                    
                // }

                //let cursorPosition = editor.selection.active;

                // Detect indentation style based on the current line
                // const currentLineText = document.lineAt(cursorPosition.line).text;
                // const lineIndentMatch = currentLineText.match(/^\s*/); // Match leading whitespace (spaces or tabs)
                // const detectedIndent = lineIndentMatch ? lineIndentMatch[0] : ''; // Preserve tabs or spaces

                // const edit = new vscode.WorkspaceEdit();

                // for (let i = 0; i < linesToInsert.length; i++) {
                //     let lineText = linesToInsert[i];

                //     // Preserve the detected indentation for all lines after the first
                //     const formattedLine = i > 0 ? detectedIndent + lineText : lineText;

                //     // Insert the formatted line
                //     edit.insert(document.uri, cursorPosition, formattedLine + '\n');
                // }

                // Apply the edit
                //await vscode.workspace.applyEdit(edit);

            } catch (error) {
                console.log(error);
                vscode.window.showErrorMessage("Failed to get code suggestion. " + error.message);
            }
        });
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
        await analyzeFileProvider.sendBlocksToLLM(blocks);
    }));
    
    return analyzeFileProvider;  
}

module.exports = {
    registerAnalyzeFileProvider
};