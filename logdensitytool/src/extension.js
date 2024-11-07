const vscode = require('vscode');
const axios = require('axios');
const { getGitRemoteUrl } = require('./utils/gitHelper'); // Import the required function
const LogDensityCodeLensProvider = require('./providers/logDensityCodeLensProvider');
const { registerOpenTabsSideBarProvider, OpenTabsSidebarProvider } = require('./providers/openTabsSidebarProvider');
const trainModelService = require('./services/trainModelService');
const runModelService = require('./services/runModelService');
const { registerJavaFileProvider, JavaFileProvider } = require('./providers/javaFileProvider');  
const { registerAnalyzeFileProvider} = require('./providers/analyzeFileProvider')

let trained = false;
let remoteUrl; // Store the remote URL if needed
const codeLensProvider = new LogDensityCodeLensProvider();

async function analyzeDocument(document) {
    if (document?.languageId !== "java") {
        return;
    }
    const { blocks } = await runModelService.runModel(remoteUrl, document.getText());
    codeLensProvider.setData(blocks);  // Update CodeLens with new data
}

async function callGenerationBackendPost(path, args) {
	const URL = 'http://localhost:8888'
	return await axios.post(URL + path, args, {
		headers: {
			'Content-Type': 'application/json',
		}
	});
}

async function callGenerationBackendGet(path, params) {
    /**
     * path : string of path ex: "/help"
     * params : map of params ex: {param1: "testing1", param2: 2}
     */
	const URL = 'http://localhost:8888'
	let parameters = ""
	if (params != null && typeof params === 'object') {
        parameters = '?' + Object.entries(params)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');
    }
	return await axios.get(URL + path + parameters);
}

async function generateLogAdvice() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage("No active editor found.");
        return;
    }

    const selectedText = editor.document.getText(editor.selection);
    if (!selectedText) {
        vscode.window.showInformationMessage("Please select some code.");
        return;
    }

    const prompt = (
        "Context: You are an AI assistant that helps people with their questions. "
        + "Please only add 2 to 5 lines of code to improve log messages to the following code: "
        + selectedText
    );

    // Show loading progress window while waiting for the response
    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Generating Log Advice",
        cancellable: false
    }, async (progress) => {
        progress.report({ message: "Contacting LLM..." });

        try {
            console.log("Calling the LLM model to get code suggestion with the selected text: ", selectedText);
            
			// Call your LLM service
			const response = await callGenerationBackendPost('/predict', {prompt: prompt, max_new_tokens: 100, temperature: 0.1}) 
            

            console.log("Response from LLM model: ");
			console.log(JSON.stringify(response.data, null, 2))
            const suggestedCode = response.data.content;

            // Create a text edit with the generated code
            const edit = new vscode.WorkspaceEdit();
            const range = new vscode.Range(editor.selection.start, editor.selection.end);
            edit.replace(editor.document.uri, range, suggestedCode);

            // Apply the edit as a preview
            await vscode.workspace.applyEdit(edit);

            // Prompt the user to accept or decline the changes
            const userResponse = await vscode.window.showInformationMessage(
                "Log advice generated. Do you want to apply the changes?",
                "Yes",
                "No"
            );

            if (userResponse === "Yes") {
                // Apply the changes permanently
                await editor.edit(editBuilder => {
                    editBuilder.replace(editor.selection, suggestedCode);
                });
                vscode.window.showInformationMessage("Log advice applied.");
            } else {
                // Revert the changes
                vscode.commands.executeCommand('undo');
                vscode.window.showInformationMessage("Log advice discarded.");
            }
        } catch (error) {
            console.error(error);
            vscode.window.showErrorMessage("Failed to get code suggestion.");
        }
    });
}

function activate(context) {
    const workspaceRoot = vscode.workspace.rootPath;

    // Register Codelens
    context.subscriptions.push(vscode.languages.registerCodeLensProvider({ language: 'java' }, codeLensProvider));

    context.subscriptions.push(vscode.commands.registerCommand('extension.showLogDensityInfo', block => {
        vscode.window.showInformationMessage(`Details for block starting at line ${block.blockLineStart}: ${JSON.stringify(block)}`);
    }));
 
    // Register AnalyzeFileProvider and JavaFileProvider and OpenTabsSidebarProvider
    const openTabsSidebarProvider = registerOpenTabsSideBarProvider(context);
    const analyzeFileProvider = registerAnalyzeFileProvider(context);
    const javaFileProvider = registerJavaFileProvider(context, analyzeFileProvider);
    analyzeFileProvider.setJavaFileProvider(javaFileProvider);

    // Initialize and use the Git remote URL
    getGitRemoteUrl().then((url) => {
        remoteUrl = url;
        console.log("Git detected url.")
    });

    let disposableTrain = vscode.commands.registerCommand('extension.sendGitHubUrl', async () => {
        const url = await vscode.window.showInputBox({ prompt: 'Enter GitHub URL to train model', value: remoteUrl });
        if (url) {
            await trainModelService.trainModel(url);
            remoteUrl = url;
            console.log(`setting github url... ${remoteUrl}`)
            openTabsSidebarProvider.setUrl(remoteUrl);
            analyzeFileProvider.setRemoteUrl(remoteUrl);
            trained = true;
            const activeEditor = vscode.window.activeTextEditor;

            if (activeEditor) {
                await analyzeDocument(activeEditor.document);
            }
        } else {
            vscode.window.showErrorMessage('GitHub URL is required');
        }


    });

    // File event handlers, sends file content to backend on change
    const analyzeEditedFileDisposable = vscode.workspace.onDidChangeTextDocument(event => {
        if (trained && remoteUrl && event.document.languageId === "java") {
            analyzeDocument(event.document);
        }
    });

    // File event handlers, sends file content to backend on file open
    const analyzeOpenedFileDisposable = vscode.workspace.onDidOpenTextDocument(document => {
        if (trained && remoteUrl && document.languageId === "java") {
            analyzeDocument(document);
        }
    });

    const analyzeNewJavaFilesCommand = vscode.commands.registerCommand('extension.analyzeNewJavaFiles', async () => {
        const allFiles = await getAllJavaFiles();
        const results = await analyzeProjectFiles(allFiles);
        if (results) {
            console.log(results);  
            vscode.window.showInformationMessage('New Java files analysis complete. Check the console for details.');
        }
    });

    let generateLog = vscode.commands.registerCommand('log-advice-generator.generateLogAdvice', generateLogAdvice);

    let changeModel = vscode.commands.registerCommand('log-advice-generator.changeModelId', async () => {
        const response = await callGenerationBackendGet('/model_info', null);
        const MODEL_ID = response.data.model_name;
        const model = await vscode.window.showInputBox({ prompt: 'Enter a HuggingFace Model ID', value: MODEL_ID });
        
        if (model) {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Changing Model to: ${model}`,
                cancellable: false
            }, async (progress) => {
                progress.report({message: "Initializing model change..." });
                
                try {
                    const response = await callGenerationBackendPost('/change_model', { hf_model_id: model });
                    
                    if (response.data.completed === true) {
                        vscode.window.showInformationMessage('Model Change has been successful, Model configured: ' + response.data.model_name);
                    } else {
                        vscode.window.showErrorMessage('Model Change Failed, Model configured: ' + response.data.model_name);
                    }
                } catch (error) {
                    vscode.window.showErrorMessage('An error occurred during the model change process.');
                }
            });
        } else {
            vscode.window.showErrorMessage('MODEL ID is required');
        }
    });
    

    let changeToken = vscode.commands.registerCommand('log-advice-generator.changeToken', async () => {
        const token = await vscode.window.showInputBox({ prompt: 'Enter a HuggingFace Model ID'});
        if (token) {
            console.log(`Changing token`)
            const response = await callGenerationBackendPost('/change_token', {hf_token: token})
			console.log(JSON.stringify(response.data, null, 2))
            if (response.data.completed == true) {
                vscode.window.showInformationMessage('Token Change has been successfull')
            } else {
				vscode.window.showErrorMessage('Token Change Failed');
			}
        } else {
            vscode.window.showErrorMessage('TOKEN is required');
        }
    });

    let getModelInfo = vscode.commands.registerCommand('log-advice-generator.modelInfo', async () => {
		const response = await callGenerationBackendGet('/model_info', null)
		console.log(JSON.stringify(response.data, null, 2))
        vscode.window.showInformationMessage('The model configured is [' + response.data.model_name + ']')
		vscode.window.showInformationMessage('Running on [' + response.data.device + ']')


    });

    context.subscriptions.push(
        disposableTrain,
        analyzeEditedFileDisposable,
        analyzeOpenedFileDisposable,
        generateLog,
        changeModel,
        changeToken,
        getModelInfo
    );
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
