# Ollama

[Retour REAMDE.md](/README.md#ollama)

By default, ollama is bundled with the backend. There are some requirements to run on GPU, you can follow the instruction in [Docker](#docker).  
Otherwise, you can use the [App](#app)

## App

- Download here : <a href="https://ollama.com/" target="_blank">https://ollama.com/</a>
- Once the application is started, you can use the terminal to use and run commands with ollama.
- Start backend API with this command in terminal `ollama serve`

## Docker

- Instruction here : <a href="https://hub.docker.com/r/ollama/ollama" target="_blank">Docker Hub : Ollama</a>
- For Windows, you need to :
    1. Enable WSL2
    2. Install Ubuntu
    3. Open the instance
    4. Follow the Ollama GPU guide
    5. Enable Ubuntu wsl integration
    ![wsl_integration](./ressources//wsl_integration.png)

Ollama Docker should use the your GPU if compatible

## Terminal Commands

- Download model : `ollama pull <model:size>`
- Run model in terminal : `ollama run <model:size>`

For more commands here is Ollama's quickstart guiide : <a href="https://github.com/ollama/ollama/blob/main/README.md#quickstart" target="_blank">Github - Ollama Quickstart</a>

## API Documentation

<a href="https://github.com/ollama/ollama/blob/main/docs/api.md" target="_blank">Github: Ollama API Doc</a>

## Model Search

<a href="https://ollama.com/search" target="_blank">Ollama Model Search</a>
