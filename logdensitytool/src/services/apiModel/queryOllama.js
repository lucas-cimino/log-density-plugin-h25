const OllamaApiModel = require('./ollamaApiModelService');
const fs = require('fs');

const OLLAMA_URL = "http://localhost";
const OLLAMA_PORT = 11434;
const MODEL = "llama3.2:3b"; // Change selon le modèle dispo
const PROMPT_INTRO = "Analyse et explique les logs trouvés dans ces fichiers Java :\n\n";

async function runQuery() {
    const ollama = new OllamaApiModel(OLLAMA_URL, OLLAMA_PORT, MODEL, null);

    try {
        
        // Vérifier si le fichier des changements existe
        let logsData = "Aucun logs trouvés.";
        if (fs.existsSync('logs_extracted.txt')) {
            changes = fs.readFileSync('logs_extracted.txt', 'utf8');
        }

        console.log("Voici les changements: "+changes);

        // Check if the model is available
        const modelsInfo = await ollama.info();
        if (!modelsInfo.model.includes(MODEL)) {
            console.log(`Model ${MODEL} not found. Pulling it now...`);
            await ollama.changeModel(MODEL);
        }

        // Generate text
        const response = await ollama.generate(MODEL, "", PROMPT_INTRO + changes, 0.8, 128);
        console.log("Réponse d'Ollama:", response);
    } catch (error) {
        console.error("Erreur avec Ollama:", error.message);
        if (error.response) {
            console.error("Response Status:", error.response.status);
            console.error("Response Data:", JSON.stringify(error.response.data, null, 2));
        }    }
}

runQuery();
