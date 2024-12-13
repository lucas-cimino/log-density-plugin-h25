# LLM Development Guide

[[Return]](README.md)

## Table of Contents

- [Introduction](#introduction)
- [Configuration File: `model_config.js`](#configuration-file-model_configjs)
  - [Changing the API Service](#changing-the-api-service)
  - [Adjusting Model Parameters](#adjusting-model-parameters)
  - [Changing the Response Parsing Strategy](#changing-the-response-parsing-strategy)
- [Prompt Files](#prompt-files)
  - [Example: `generate_log.txt`](#exemple-generate_logtxt)
  - [Attribute Detection in Prompts](#attribute-detection-in-prompts)
  - [Injection Variable](#injection-variable)
  - [Commenting Attributes](#commenting-attributes)  
- [Summary](#summary)

## Introduction

This README provides instructions for developers on how to configure and customize prompt generation for log advice using a Language Learning Model (LLM) service. The main configuration file is `model_config.js`, and the prompt templates reside in the `prompt` folder as `.txt` files.

## Configuration File: `model_config.js`

The `model_config.js` file exports a `configuration` object that allows you to control which model and response handling strategy is used, as well as parameters for prompt generation.

Below is an example configuration file and its parameters:

```js
/* eslint-disable no-unused-vars */
// API IDs available
const HuggingFaceApiModel = require("./services/apiModel/huggingFaceApiModelService");
const OllamaApiModel = require("./services/apiModel/ollamaApiModelService");

// Response IDs type available
const JsonResponse = require("./services/response/jsonResponseService");
const RegexResponse = require("./services/response/regexResponseService");
const StandardResponse = require("./services/response/standardResponseService");

let configuration = {
    api_id : OllamaApiModel.apiId, // Ollama or HuggingFace available
    url : "http://localhost", // LLM service URL
    port : "11434", // LLM service Port
    prompt_file : "generate_log.txt", // Name of the prompt file in /prompt folder
    default_model : "llama3.2:3b", 
    default_token : "", // Only used for HuggingFace if needed
    llm_temperature: null, // (0.0 - 1.0) Higher = more creative, null = not configured
    llm_max_token: null, // Token limit, null = not configured
    response_id :  JsonResponse.responseId, // Choose a response strategy
    attributes_to_comment : ["reason"], // Attributes to comment out
    comment_string: "//", // Comment string prefix
    injection_variable: "{vscode_content}" // Placeholder for injecting VSCode snippet
};

module.exports = {
    configuration
};
```

### Changing the API Service

#### - Ollama (default)

Set `api_id` to `OllamaApiModel.apiId` to use Ollama-based LLM services.

#### - HuggingFace

Set `api_id` to `HuggingFaceApiModel.apiId` to use a HuggingFace-based LLM service.
If using HuggingFace, you may need to provide a default_token and a valid default_model.

### Adjusting Model Parameters

#### - URL & Port

Change `url` and `port` if the LLM service isn’t running at `http://localhost:11434`.  (Ollama default)

#### - Temperature (`llm_temperature`)

Increase this value (up to 1.0) to make the responses more creative. Lower it (towards 0.0) for more deterministic responses. `null` uses the model’s default setting.  

#### - Max Tokens (llm_max_token)

Control the length of the generated response:

- `null`: Not configured (model default)
- A positive number (e.g., `128`) limits token count.
- `-1` for infinite generation.
- `-2` for fill context behavior.

### Changing the Response Parsing Strategy

#### - JSON Response

Use `JsonResponse.responseId` to parse model output as JSON.

#### - Regex Response

Use `RegexResponse.responseId` to parse output using regex patterns.

#### - Standard Response

Use `StandardResponse.responseId` If you want to get the raw model output.

## Prompt Files

Prompt files (`.txt`) reside in the `prompt` folder. The filename specified by `prompt_file` in `model_config.js` determines which prompt is used. You can create multiple prompt files and switch them by updating `prompt_file`.

### Exemple: `generate_log.txt`

```text
Generate one log message to add to this Java method in empty spaces:

{vscode_content}

The response should be in the following json form and without any other explanations:

{{
    "log_statement": "System.out.println(<log message or variable>);", 
    "reason": "how did you reason to generate the log message"
}}
```

In this prompt:

- `{vscode_content}` is replaced at runtime with the currently selected text from VSCode.
- The response is requested in a JSON format with `log_statement` and `reason` fields.

You can adjust this prompt to request different output formats, additional attributes, or different logging styles. Just ensure the prompt structure matches what your response parsing strategy expects.

### Attribute Detection in Prompts

To have the tool detect specific output attributes, enclose them within double braces `{{` and `}}` in the prompt file. This signals to the extraction logic that these attributes should be identified and extracted. After detection, the tool will remove the double braces, leaving a valid JSON object for the response.

Example Pattern:

```text
{{
  "attribute_name": "attribute_value"
}}
```

The extraction logic will:

1. Identify attributes between {{ and }}.
2. Remove the extra braces and finalize the JSON structure.

### Injection Variable

In your prompt files, the `injection_variable` (e.g., `{vscode_content}`) marks where the selected code snippet from the editor will be inserted. Ensure your prompt contains this placeholder where you want the code snippet to appear.

### Commenting Attributes

The `attributes_to_comment` array holds keys from the generated JSON that should be commented out. For example, if `"reason"` is in `attributes_to_comment`, the output line for reason will be prefixed by the `comment_string` (e.g., `//`) in the final inserted code.

## Summary

- **`model_config.js`:** Control which model and response parser you use, along with LLM parameters like temperature and max tokens.
- **Prompt Files (`.txt`):** Customize instructions and desired output format. Insert `{vscode_content}` where the user’s code should appear.
- **Attributes in Double Braces:** For attribute extraction, wrap attributes between `{{` and `}}`. These braces are removed after attribute detection, leaving valid JSON.
- **Comments & Attributes:** Use `attributes_to_comment` and `comment_string` to comment out certain fields.
- **API Services:** Switch between Ollama and HuggingFace by changing `api_id` and related parameters.

By adjusting these configurations and prompts, you can tailor the log advice generation to fit your development environment, coding standards, and desired output format.

For information the process of the generation you can consult this sequence diagram : [sequence diagram - generate log advice](../ARTIFACTS.md#sequence-diagrams---log-assistant-tool)
