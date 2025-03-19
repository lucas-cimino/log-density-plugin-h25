const OllamaApiModel = require('./ollamaApiModelService');
const fs = require('fs');

const OLLAMA_URL = "http://localhost";
const OLLAMA_PORT = 11434;
const MODEL = "llama3.2:3b"; // Change selon le modèle dispo
const PROMPT_INTRO = "Analyse et explique les logs trouvés dans ces fichiers Java :\n\n";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const PR_NUMBER = process.env.PR_NUMBER;
const REPO = process.env.REPO;

const { execSync } = require("child_process");

async function commentOnPR(prNumber, filePath, lineNumber) {  

  try {
    const { Octokit } = await import("@octokit/rest");

    const [owner, repo] = REPO.split("/");
    const octokit = new Octokit({ auth: GITHUB_TOKEN });

    async function getLatestCommitID() {
      try {
        const pr = await octokit.pulls.get({
          owner,
          repo,
          pull_number: PR_NUMBER,
        });
        return pr.data.head.sha; // Latest commit in the PR
      } catch (error) {
        console.error("Error fetching PR commit ID:", error);
        process.exit(1);
      }
    }

    const commitId = await getLatestCommitID();

    await octokit.pulls.createReviewComment({
      owner,
      repo,
      pull_number: prNumber,
      body: `HALLO :D`,
      commit_id: commitId,
      path: filePath,
      line: lineNumber,
    });
    console.log(`Commentaire ajouté sur 77 de CreatOption`);
  } catch (error) {
    console.error("Erreur lors de l'ajout du commentaire :", error);
  }

}

async function runQuery() {
    //const ollama = new OllamaApiModel(OLLAMA_URL, OLLAMA_PORT, MODEL, null);
    
    if (!GITHUB_TOKEN || !PR_NUMBER || !REPO) {
        console.error("Missing required environment variables");
        process.exit(1);
    }
   
    
    try {


      // Get the git diff
      const fileList = execSync("git diff --name-only origin/main -- *.java")
          .toString()
          .trim()
          .split("\n")
          .filter(file => file);

      commentOnPR(PR_NUMBER, 'training_data/CreateOptions.java', 77);
      if (fileList.length === 0) {
        console.log("No Java files changed.");
        process.exit(0);
      }

      for (const filePath of fileList) {
        console.log(`Processing ${filePath}...`);
        // Get the diff for the specific file
        const diff = execSync(`git diff -U0 origin/main -- ${filePath}`).toString();
        const context = fs.readFileSync(filePath, 'utf8');
        // Extract changed line numbers using regex
        // ================ call API here ====================

        // ================ returns line number and changes ================
        //commentOnPR(PR_NUMBER, filePath, 77);

        console.log(`${filePath} changes: `+ diff);
        console.log("full context: "+context);

      }

      console.log("Comment posted successfully.");
    } catch (error) {
      console.error("Error posting comment:", error);
      process.exit(1);
    }
}

runQuery();
