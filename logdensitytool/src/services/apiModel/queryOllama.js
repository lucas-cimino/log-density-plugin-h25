const OllamaApiModel = require('./ollamaApiModelService');

const OLLAMA_URL = "http://localhost";
const OLLAMA_PORT = 11434;
const MODEL = "llama2:3b"; // Change selon le modèle dispo
const PROMPT = "Explique-moi comment fonctionne GitHub Actions.";

async function runQuery() {
    const ollama = new OllamaApiModel(OLLAMA_URL, OLLAMA_PORT, MODEL, null);

    try {
        const response = await ollama.generate(MODEL, "", PROMPT, 0.8, 128);
        console.log("Réponse d'Ollama:", response);
    } catch (error) {
        console.error("Erreur avec Ollama:", error);
    }
}

runQuery();
