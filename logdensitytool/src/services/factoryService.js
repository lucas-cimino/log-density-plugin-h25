/* eslint-disable no-unused-vars */

// Model serivces available
const HuggingFaceApiModel = require("./apiModel/huggingFaceApiModelService");
const OllamaApiModel = require("./apiModel/ollamaApiModelService");

// Response Services available
const JsonResponse = require("./response/jsonResponseService");
const RegexResponse = require("./response/regexResponseService");
const StandardResponse = require("./response/standardResponseService");

/**
 * Creates an API service instance based on the api attribute name in config file.
 * @returns {HuggingFaceApiModel | OllamaApiModel} The selected API service instance.
 */
function createApiModel(apiId, url, port, default_model, defaultToken) {

  switch (apiId) {
    case OllamaApiModel.apiId:
      return new OllamaApiModel(url, port, default_model, defaultToken);
    case HuggingFaceApiModel.apiId:
      return new HuggingFaceApiModel(url, port, default_model, defaultToken);
    default:
      throw new Error(`Unsupported API name: ${apiId}`);
  }
}

/**
 * Create a response service instance based on responseID given in config file
 * @param {string} responseId supported response ID
 * @returns {StandardResponse | JsonResponse | RegexResponse} The selected response service instance
 */
function createResponse(responseId) {

  switch (responseId) {
    case StandardResponse.responseId:
      return new StandardResponse()
    case JsonResponse.responseId:
      return new JsonResponse()
    case RegexResponse.responseId:
      return new RegexResponse()
    default:
      throw new Error(`Unsupported Response type: ${responseId}`);
  }

}

module.exports = {
  createApiModel, 
  createResponse
};
