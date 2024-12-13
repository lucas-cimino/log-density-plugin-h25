const StandardResponse = require("./services/response/standardResponseService");
const vscode = require('vscode');
const { getGitRemoteUrl } = require('./utils/gitHelper'); // Import the required function
const LogDensityCodeLensProvider = require('./providers/logDensityCodeLensProvider');
const { registerOpenTabsSideBarProvider } = require('./providers/openTabsSidebarProvider');
const { trainModel } = require('./services/trainModelService');
const { runModel } = require('./services/runModelService');
const { registerJavaFileProvider } = require('./providers/javaFileProvider');
const { registerAnalyzeFileProvider } = require('./providers/analyzeFileProvider');
const { createApiModel, createResponse } = require('./services/factoryService');
const { configuration } = require('./model_config');
const { readFile } = require("./utils/fileReader");
const { buildPrompt, getSurroundingMethodText, extractAttributesFromPrompt } = require("./utils/modelTools")
const path = require('path');

const { api_id, url, port, prompt_file, default_model, default_token, llm_temperature, llm_max_token, response_id, attributes_to_comment, comment_string, injection_variable } = configuration;

let trained = false;
let remoteUrl; // Store the remote URL if needed
let apiModelService;
let reponseService;
const codeLensProvider = new LogDensityCodeLensProvider();


function initialize() {
    apiModelService = createApiModel(api_id, url, port, default_model, default_token);
    reponseService = createResponse(response_id);
}

async function analyzeDocument(document) {
    if (document && document.languageId !== "java") {
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
    let selectedText = ""

    if (!selection.isEmpty) {
        // L'utilisateur a sélectionné du texte (méthode)
        selectedText = document.getText(selection);
    }

    selectedText = getSurroundingMethodText(document, cursorLine);

    // Générer un prompt spécifique pour le modèle
    let prompt = (
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

            // Get the current directory of the script
            const projectBasePath = path.resolve(__dirname, "..", "..");
            let system_prompt = await readFile(path.join(projectBasePath, "prompt", prompt_file)) // Extract prompt from txt file

            let attributes = []
            // Find and extract attributes from prompt {{json}}
            if (system_prompt.includes("{{") && system_prompt.includes("}}")) {
                attributes = extractAttributesFromPrompt(system_prompt, attributes_to_comment) // Extract attributes from prompt {{json}}
                system_prompt = system_prompt.replace("{{", "{");
                system_prompt = system_prompt.replace("}}", "}");
            }
            
            // Build Prompt
            const builtPrompt = buildPrompt(selectedText, system_prompt, injection_variable)
            if (builtPrompt != null) {
                prompt = builtPrompt
            }

            let linesToInsert = [];
            while (linesToInsert.length === 0) {
                
                console.log("Generating log advice...");
                const modelResponse = await apiModelService.generate(model, null, prompt, llm_temperature, llm_max_token);
                if (attributes.length > 0) {
                    linesToInsert = reponseService.extractLines(modelResponse, attributes, attributes_to_comment, comment_string);
                } else {
                    const standardResponse = createResponse(StandardResponse.responseId)
                    linesToInsert = standardResponse.extractLines(modelResponse, attributes, attributes_to_comment, comment_string);
                }
                
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
            vscode.window.showErrorMessage("Failed to get code suggestion. " + error.message);
        }
    });
}

function activate(context) {
    initialize();
    // eslint-disable-next-line no-unused-vars
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

    /* Commented functionnality, missing functions getAllJavaFiles() and analyzeProjectFiles()
    const analyzeNewJavaFilesCommand = vscode.commands.registerCommand('extension.analyzeNewJavaFiles', async () => {
        const allFiles = await getAllJavaFiles();
        const results = await analyzeProjectFiles(allFiles);
        if (results) {
            console.log(results);
            vscode.window.showInformationMessage('New Java files analysis complete. Check the console for details.');
        }
    });
    */

    let generateLog = vscode.commands.registerCommand('log-advice-generator.generateLogAdvice', generateLogAdvice);

    let changeModel = vscode.commands.registerCommand('log-advice-generator.changeModelId', async () => {
        const MODEL_ID = await apiModelService.getModel();
        const model = await vscode.window.showInputBox({ prompt: `Enter ${api_id} Model ID`, value: MODEL_ID });
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
        const token = await vscode.window.showInputBox({ prompt: `Enter ${api_id} Token` });
        if (token) {
            console.log(`Changing token`)
            const response = await apiModelService.changeToken(token);
            //console.log(JSON.stringify(response, null, 2));
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
        //console.log(JSON.stringify(response.model, null))
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
