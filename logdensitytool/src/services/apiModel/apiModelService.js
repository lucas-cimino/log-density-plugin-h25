/* eslint-disable no-unused-vars */
// Abstract Base Class
class ApiModel {

  constructor(url, port, initialModel, initialToken) {
    if (new.target === ApiModel) {
      throw new Error("Cannot instantiate abstract class ApiModelService directly.");
    }
    this.url = url;
    this.port = port;
    this.model = initialModel
    this.token = initialToken
    this.ready = false
    this.init(initialModel, initialToken)
  }
  
  /**
   * Returns api ID
   * @returns string of apiId
   */
  static get apiId() {
    return ""
  }

  /**
   * Generates a response or output based on the provided input data.
   * Some parameters may not be used or be optional
   * Current implementation doesn't use system
   * @param {string} model - The name of the model to use.
   * @param {string} system - The system message used to specify custom behavior.
   * @param {string} prompt - The input prompt for the model.
   * @param {string} temperature - Temperature of model response.
   * @param {string} max_token - Max tokens generated by model for response.
   * @returns {string} Raw LLM Response
   */
  async generate(model, system, prompt, temperature, max_token) {
    this.checkReady() // Check readyness before use
    throw new Error("Method 'generate()' must be implemented.");
  }

  /**
   * Changes the model being used and download it if missing in at LLM API Service
   * @param {string} modelId - The name of the new model.
   * @returns {completed: boolean, model: string} 
   * completed: true if model changed, false if not. model: indicate the model configured
   */
  async changeModel(modelId) {
    throw new Error("Method 'changeModel()' must be implemented.");
  }

  /**
   * Relevant information about the LLM API Service
   * @returns {any}
   */
  async info() {
    throw new Error("Method 'info()' must be implemented.");
  }

  /**
   * Simple Function get the configured modelId
   * @returns {string} Model configured
   */
  async getModel() {
    throw new Error("Method 'getModel()' must be implemented.");
  }

  /**
   * Change Token used by LLM API Service
   * @param {string} token 
   * @returns {completed: boolean, message: string} 
   * completed: true if model changed, false if not. message: error or success message
   */
  async changeToken(token) {
    throw new Error("Method 'changeToken()' must be implemented.");
  }

  /**
   * 
   * @param {string} model - Model used for initalisation
   * @param {string} token - Token used for initalisation
   */
  async init(model, token) {
    if (model) {
      await this.changeModel(model);
    }
    if (token) {
      await this.changeToken(model);
    }
    this.ready = true
    console.log(`${this.constructor.name} initialization complete.`)
  }

  checkReady() {
    if (!this.ready) {
      throw new Error(`${this.constructor.name} initialization with ${this.model} is not completed. Please wait.`);
    }
  }
}

module.exports = ApiModel;
