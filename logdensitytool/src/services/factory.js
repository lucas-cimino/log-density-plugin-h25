const HfApiModel = require("./apiModel/hfApiModel");
const OllamaApiModel = require("./apiModel/ollamaApiModel");
const JSONResponseHandler = require("./response/JSONResponseHandler");
const StandardResponse = require("./response/standardResponse");

/**
 * Creates an API service instance based on the api attribute name in config file.
 * @returns {HfApiModel | OllamaApiModel} The selected API service instance.
 */
function createApiModel(api, url, port, system_prompt, default_model, default_token) {

  switch (api.toLowerCase()) {
    case OllamaApiModel.apiId:
      return new OllamaApiModel(url, port, system_prompt, default_model, default_token);
    case HfApiModel.apiId:
      return new HfApiModel(url, port, system_prompt, default_model, default_token);
    default:
      throw new Error(`Unsupported API name: ${api}`);
  }
}

/**
 * Create a response service instance based on responseID given in config file
 * @param {string} responseId supported response ID
 * @returns {StandardResponse | JSONResponseHandler} The selected response service instance
 */
function createResponse(responseId) {

  switch (responseId.toLowerCase()) {
    case StandardResponse.responseId:
      return new StandardResponse()
    case JSONResponseHandler.responseId:
      return new JSONResponseHandler()
    default:
      throw new Error(`Unsupported Response type: ${responseId}`);
  }

}

module.exports = {createApiModel, createResponse};
