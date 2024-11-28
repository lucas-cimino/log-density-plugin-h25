const vscode = require('vscode');
const axios = require('axios');
const { getGitRemoteUrl } = require('./utils/gitHelper'); // Import the required function
const LogDensityCodeLensProvider = require('./providers/logDensityCodeLensProvider');
const { registerOpenTabsSideBarProvider, OpenTabsSidebarProvider } = require('./providers/openTabsSidebarProvider');
const trainModelService = require('./services/trainModelService');
const runModelService = require('./services/runModelService');
const { registerJavaFileProvider, JavaFileProvider } = require('./providers/javaFileProvider');  
const { registerAnalyzeFileProvider} = require('./providers/analyzeFileProvider');
const createApiModelService = require('./services/ApiModelFactory');
const { extractLog } = require('./utils/regex');
const config = require('./config.json');
const { api, url, port, system_prompt, default_model, default_token } = config;

let trained = false;
let remoteUrl; // Store the remote URL if needed
const codeLensProvider = new LogDensityCodeLensProvider();
const apiModelService = createApiModelService(api, url, port, system_prompt, default_model, default_token)

async function analyzeDocument(document) {
    if (document?.languageId !== "java") {
        return;
    }
    const { blocks } = await runModelService.runModel(remoteUrl, document.getText());
    codeLensProvider.setData(blocks);  // Update CodeLens with new data
}

async function generateLogAdvice() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage("No active editor found.");
        return;
    }


    const document = editor.document;
    const selection = editor.selection;
    const cursorLine = selection.active.line; // Ligne actuelle du curseur

    if (!selection.isEmpty) {
        // L'utilisateur a sélectionné du texte (méthode)
        selectedText = document.getText(selection);
    } 

    // Fonction pour extraire la méthode autour d'une ligne spécifique
    function getSurroundingMethodText(lineNumber) {
        let startLine = lineNumber;
        let endLine = lineNumber;

        // Chercher le début de la méthode
        while (startLine > 0 && !document.lineAt(startLine).text.trim().endsWith("{")) {
            startLine--;
        }

        // Chercher la fin de la méthode
        while (endLine < document.lineCount - 1 && !document.lineAt(endLine).text.trim().endsWith("}")) {
            endLine++;
        }

        // Récupérer le texte de la méthode complète
        const methodRange = new vscode.Range(startLine, 0, endLine, document.lineAt(endLine).text.length);
        return document.getText(methodRange);
    }

    selectedText = getSurroundingMethodText(cursorLine);

    // Générer un prompt spécifique pour le modèle
    const prompt = (
    // Promt modifiable dans le backend dans un fichier config
        "Context: Suggest 1 log (System.out.println()) to add to method the following JAVA functions, don't return the input, only the output: \n"
        //+ "Please only add 2 to 5 lines of code to improve log messages to the following code: "
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
            const model = await apiModelService.getModel();
			const modelResponse = await apiModelService.generate(model, null, prompt, null, null)
            
            console.log("Response from LLM model: ");
            console.log(modelResponse)
            let suggestedCode = modelResponse;

            // Create a text edit with the generated code
            const edit = new vscode.WorkspaceEdit();
            const range = new vscode.Range(editor.selection.start, editor.selection.end);
            const tabulation = editor.selection.end.e
            edit.replace(editor.document.uri, range, extractLog(suggestedCode, tabulation));

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
        const MODEL_ID = await apiModelService.getModel();
        const model = await vscode.window.showInputBox({ prompt: `Enter ${api} Model ID`, value: MODEL_ID });
        if (model) {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Changing Model to: ${model}`,
                cancellable: false
            }, async (progress) => {
                progress.report({message: "Initializing model change..." });
                
                try {
                    const response = await apiModelService.changeModel(model)
                    
                    if (response.completed === true) {
                        vscode.window.showInformationMessage('Model Change has been successful, Model configured: ' + response.model);
                    } else {
                        vscode.window.showErrorMessage('Model Change Failed, Model configured: ' + response.model);
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
        const token = await vscode.window.showInputBox({ prompt: `Enter ${api} Token` });
        if (token) {
            console.log(`Changing token`)
            const response = await apiModelService.changeToken(token);
			console.log(JSON.stringify(response, null, 2));
            if (response.completed == true) {
                vscode.window.showInformationMessage('Token Change has been successfull')
            } else {
				vscode.window.showErrorMessage(response.message);
			}
        } else {
            vscode.window.showErrorMessage('TOKEN is required');
        }
    });

    let getModelInfo = vscode.commands.registerCommand('log-advice-generator.modelInfo', async () => {
		const response = await apiModelService.info();
        console.log(JSON.stringify(response.model, null))
        vscode.window.showInformationMessage("Model : " + JSON.stringify(response.model, null))
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
