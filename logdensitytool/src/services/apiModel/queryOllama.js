const OllamaApiModel = require('./ollamaApiModelService');

const OLLAMA_URL = "http://localhost";
const OLLAMA_PORT = 11434;
const MODEL = "llama2:3b"; // Change selon le modèle dispo
const PROMPT = "Explique-moi comment fonctionne GitHub Actions.";

async function runQuery() {
    const ollama = new OllamaApiModel(OLLAMA_URL, OLLAMA_PORT, MODEL, null);

    try {
        // Check if the model is available
        const modelsInfo = await ollama.info();
        console.log(modelsInfo.model);
        MODEL = modelsInfo.model;
        // if (!modelsInfo.model.includes(MODEL)) {
        //     console.log(`Model ${MODEL} not found. Pulling it now...`);
        //     await ollama.changeModel(MODEL);
        // }

        // Generate text
        const response = await ollama.generate(MODEL, "", PROMPT, 0.8, 128);
        console.log("Réponse d'Ollama:", response);
    } catch (error) {
        console.error("Erreur avec Ollama:", error);
    }
}

runQuery();
