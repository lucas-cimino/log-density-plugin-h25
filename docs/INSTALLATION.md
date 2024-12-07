# Installation

## Prerequisites

- Docker
- Node.js and npm
- Python

## Setting Up the Log Density Backend

1. Open terminal in project root
2. Run this command :

```bash
   docker-compose -f ./services/docker-compose.yml up --build
```

3. 3 services will start
   - services-training
   - services-model_runner
   - ollama

## Setting Up the Frontend

1. Install the necessary dependencies: `npm install`
2. Make sure that your vs code IDE is the same version as the one specified in the package.json file. Your VS Code version can be obtained by clicking on **Help** > **About**.
3. Start the extension in **Run & Debung** or `npm start`
4. (`Ctrl+Shift+P` or `Cmd+Shift+P` on macOS) or `F1`, type `Send Github URL`, and enter a GitHub URL to start model training.
   - You can use apache zookeeper for testing purposes : [https://github.com/apache/zookeeper](https://github.com/apache/zookeeper)

## Ollama

For more information (using GPU, App, Commands and API) : [Ollama](log-assistant-tool/OLLAMA.md)

## Testing

To run the unit and integration tests:

1. Open terminal in project root
2. Create python virtual environment
   - Create a python environment with `vscode` : `F1` > `Python : Create Environment...` > `venv`
   - Create a python environment in terminal `python -m venv .venv`
3. Activate Virtual Environement
   - On Windows: `.venv\Scripts\activate`
   - On macOS/Linux: `source .venv/bin/activate`
4. Install dependancies: `pip install -r ./services/requirements.txt`
5. Use the following command:

```bash
   pytest services/service_ai_analysis
   
   pytest services/service_model_creation
```

