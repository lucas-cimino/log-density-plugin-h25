import { Console } from 'console';

const OllamaApiModel = require('./ollamaApiModelService');
const fs = require('fs');

const OLLAMA_URL = "http://localhost";
const OLLAMA_PORT = 11434;
const MODEL = "llama3.2:3b"; // Change selon le modèle dispo
const PROMPT_INTRO = "Voici les modifications dans un Pull Request GitHub. Analyse et résume les changements :\n\n";

async function runQuery() {
    const ollama = new OllamaApiModel(OLLAMA_URL, OLLAMA_PORT, MODEL, null);

    try {
        
        // Vérifier si le fichier des changements existe
        let changes = "Aucun changement trouvé.";
        if (fs.existsSync('pr_changes.diff')) {
            changes = fs.readFileSync('pr_changes.diff', 'utf8');
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
        console.error("Erreur avec Ollama:", error);
    }
}

runQuery();
