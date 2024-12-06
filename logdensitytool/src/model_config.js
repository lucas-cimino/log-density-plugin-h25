// API IDs available
const HfApiModel = require("./services/apiModel/hfApiModel");
const OllamaApiModel = require("./services/apiModel/ollamaApiModel");

// Response IDs type available
const JSONResponseHandler = require("./services/response/JSONResponseHandler");
const RegexJavaResponse = require("./services/response/regexJavaResponse")
const StandardResponse = require("./services/response/standardResponse");

let configuration = {
    api_id : OllamaApiModel.apiId, //ollama and huggingface available
    url : "http://localhost",
    port : "11434",
    prompt_file : "generate_log.txt", // From prompt Folder
    default_model : "llama3.2:3b",
    default_token : "", // Only used for huggingface
    response_id :  JSONResponseHandler.responseId, // standard or regex available
    attributes_to_comment : ["reason"], // list of attributes to comment
    comment_string : "//" // Comment string to add
}


module.exports = {
    configuration
};