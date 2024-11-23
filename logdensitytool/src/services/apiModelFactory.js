const HfApiModelService = require("./HfApiModelService");
const OllamaApiModelService = require("./OllamaApiModelService");

/**
 * Creates an API service instance based on the api_name in config file.
 * @returns {HfApiModelService | OllamaApiModelService} The selected API service instance.
 */
function createApiModelService(api, url, port, system_prompt, default_model, default_token) {
  // Extract values from config
  console.log(api, url, port, system_prompt, default_model, default_token)

  switch (api.toLowerCase()) {
    case "ollama":
      return new OllamaApiModelService(url, port, system_prompt, default_model, default_token);
    case "huggingface":
      return new HfApiModelService(url, port, system_prompt, default_model, default_token);
    default:
      throw new Error(`Unsupported API name: ${api}`);
  }
}

module.exports = createApiModelService;
