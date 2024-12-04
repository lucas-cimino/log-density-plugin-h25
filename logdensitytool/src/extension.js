const vscode = require('vscode');
const axios = require('axios');
const { getGitRemoteUrl } = require('./utils/gitHelper'); // Import the required function
const LogDensityCodeLensProvider = require('./providers/logDensityCodeLensProvider');
const { registerOpenTabsSideBarProvider, OpenTabsSidebarProvider } = require('./providers/openTabsSidebarProvider');
const { trainModel } = require('./services/trainModelService');
const { runModel } = require('./services/runModelService');
const { registerJavaFileProvider, JavaFileProvider } = require('./providers/javaFileProvider');
const { registerAnalyzeFileProvider } = require('./providers/analyzeFileProvider');
const { createApiModel, createResponse } = require('./services/factory');
const { configuration } = require('./model_config');
const { api_id, url, port, system_prompt, default_model, default_token, response_id } = configuration;

let trained = false;
let remoteUrl; // Store the remote URL if needed
const codeLensProvider = new LogDensityCodeLensProvider();
const apiModelService = createApiModel(api_id, url, port, system_prompt, default_model, default_token)
const reponseService = createResponse(response_id)

async function analyzeDocument(document) {
    if (document?.languageId !== "java") {
        return;
    }
    const { blocks } = await runModel(remoteUrl, document.getText());
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

        // Compteur pour suivre les accolades
        let openBraces = 0;

        // Chercher le début de la méthode
        while (startLine > 0) {
            const lineText = document.lineAt(startLine).text.trim();

            // Compter les accolades fermées et ouvertes
            openBraces += (lineText.match(/\}/g) || []).length;
            openBraces -= (lineText.match(/\{/g) || []).length;

            if (openBraces < 0) {
                // Trouvé le début de la méthode
                break;
            }

            startLine--;
        }

        // Réinitialiser le compteur pour chercher la fin
        openBraces = 0;

        // Chercher la fin de la méthode
        while (endLine < document.lineCount - 1) {
            const lineText = document.lineAt(endLine).text.trim();

            // Compter les accolades ouvertes et fermées
            openBraces += (lineText.match(/\{/g) || []).length;
            openBraces -= (lineText.match(/\}/g) || []).length;

            if (openBraces === 0 && lineText.includes('}')) {
                // Trouvé la fin de la méthode
                break;
            }

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
            // Call your LLM service
            const model = await apiModelService.getModel();
            let linesToInsert = [];
            while (linesToInsert.length === 0) {
                console.log("Generating log advice...");
                const modelResponse = await apiModelService.generate(model, null, prompt, null, null);
                linesToInsert = reponseService.extractLines(modelResponse, 0);
            }

            let cursorPosition = editor.selection.active;

            // Detect indentation style based on the current line
            const currentLineText = document.lineAt(cursorPosition.line).text;
            const lineIndentMatch = currentLineText.match(/^\s*/); // Match leading whitespace (spaces or tabs)
            const detectedIndent = lineIndentMatch ? lineIndentMatch[0] : ''; // Preserve tabs or spaces

            const edit = new vscode.WorkspaceEdit();

            for (let i = 0; i < linesToInsert.length; i++) {
                let lineText = linesToInsert[i];

                // Preserve the detected indentation for all lines after the first
                const formattedLine = i > 0 ? detectedIndent + lineText : lineText;

                // Insert the formatted line
                edit.insert(document.uri, cursorPosition, formattedLine + '\n');
            }

            // Apply the edit
            await vscode.workspace.applyEdit(edit);

            const userResponse = await vscode.window.showQuickPick(
                ["Yes", "No"],
                {
                    placeHolder: "Log advice generated. Do you want to apply the changes?",
                    canPickMany: false
                }
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
            await trainModel(url);
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
                progress.report({ message: "Initializing model change..." });

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

function deactivate() { }

module.exports = {
    activate,
    deactivate
};
