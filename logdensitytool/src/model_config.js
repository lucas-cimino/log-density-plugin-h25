// API IDs available
const HfApiModel = require("./services/apiModel/hfApiModel");
const OllamaApiModel = require("./services/apiModel/ollamaApiModel");

// Response IDs type available
const RegexJavaResponse = require("./services/response/regexJavaResponse");
const StandardResponse = require("./services/response/standardResponse");

let configuration = {
    api_id : OllamaApiModel.apiId, //ollama and huggingface available
    url : "http://localhost",
    port : "11434",
    system_prompt : "You are an assistant for developers who want to instrument their methods with logging statements. \r\nInstruction:  Generate one log message to add to this Java method in the tagged position with <Log_position>: \r\nThe response should be in the following json form and without any other explanations: \r\n\r\n{\r\n     log_statement: \"logger.<level>(<log message or variable>);\", \r\n     reason: \"how did you reason to generate the log message\"\r\n}\r\n",
    default_model : "llama3.2:3b",
    default_token : "", // Only used for huggingface
    response_id :  RegexJavaResponse.responseId // standard or regex available
}


module.exports = {
    configuration
};