# Log Density Analyzer for Java

## Overview

The Log Density Analyzer is a Visual Studio Code extension that leverages an AI model trained on open-source Java projects. It provides functionalities to predict and check the log density of `.java` files and projects, helping developers understand and optimize their logging practices.

## Features

- **Model Training**: Train the AI model using a collection of open-source Java projects.
- **Log Density Analysis**: Analyze individual Java files to determine the log density in each block of code.
- **Batch Log Density Prediction**: Obtain predicted and current log densities for multiple Java files at once.
- **Generate Log Advice**: Generate log advices with a large language model for the code given.

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

3. Des services vont démarrés
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

By default, ollama is bundled with the backend. There are some requirements to run on GPU, you can follow the instruction in `Option 2` you can also download the app to run the backend.

### App - Ollama

- Download here : [Ollama](https://ollama.com/)
- Start backend API with this command in terminal `ollama serve`

### Docker - Ollama

- Instruction here : [Docker Hub : Ollama](https://hub.docker.com/r/ollama/ollama)

#### Some usefull commands

- Download model : `ollama pull <model:size>`
- Run model in terminal : `ollama run <model:size>`

#### More information

- API Doc : [Github: Ollama API Doc](https://github.com/ollama/ollama/blob/main/docs/api.md)
- Models available : [Ollama Model Search](https://ollama.com/search)

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

## Contributing

Contributions are welcome! Please read our contributing (CONTRIBUTING.md) guidelines for details on our code of conduct and the process for submitting pull requests.
