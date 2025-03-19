import requests

def generate(prompt, model="llama3.2:3b"):
    """
    Send a prompt to an Ollama model and return the response.

    :param prompt: The input text to send to the model.
    :param model: The model to use (default: "llama2").
    :return: The model's response as a string.
    """
    url = "http://localhost:11434/api/generate"  # Default Ollama API endpoint
    data = {
        "model": model,
        "prompt": prompt,
        "stream": False  # Set to True if you want a streaming response
    }

    try:
        response = requests.post(url, json=data)
        response.raise_for_status()
        return response.json().get("response", "No response received.")
    except requests.exceptions.RequestException as e:
        return f"Error: {e}"
