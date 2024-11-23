// Abstract Base Class
class ApiModelService {

  apiName

  constructor(url, port, systemPrompt, initialModel, initialToke) {
    if (new.target === ApiModelService) {
      throw new Error("Cannot instantiate abstract class ApiModelService directly.");
    }
    this.url = url;
    this.port = port;
    this.systemContext = systemPrompt
    this.model = initialModel
    this.token = initialToke
  }

  async generate(model, system, prompt, temperature, max_token) {
    throw new Error("Method 'generate()' must be implemented.");
  }

  async changeModel(modelName) {
    throw new Error("Method 'changeModel()' must be implemented.");
  }

  async info() {
    throw new Error("Method 'modelInfo()' must be implemented.");
  }

  async getModel() {
    throw new Error("Method 'modelInfo()' must be implemented.");
  }

  async changeToken(token) {
    throw new Error("Method 'changeToken()' must be implemented.");
  }
}

module.exports = ApiModelService;
