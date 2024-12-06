const Response = require("./response")

class JSONResponseHandler extends Response {

  

  constructor() {
    super()
  }

  /**
   * Returns response ID
   * @returns string of responseId
   */
  static get responseId() {
    return "json";
  }

  /**
   * Extract log_statement and reason in model response and 
   * build response
   * @param {string} text Model response
   * @param {string[]} requiredAttributes - List of attribute names to check in the JSON object.
   * @returns {string[]} list of response lines
   * 
   */
  extractLines(text, requiredAttributes, attributesToComment, commentString) {

    let lines = this.loadJSON(text)
    if (this.validateJSON(lines, requiredAttributes) == false) {
      return []
    }
    let extractedAttributes = [];

    // Check if each required attribute exists in the JSON and add it to the list
    for (let attribute of requiredAttributes) {
        if (lines.hasOwnProperty(attribute)) {
          let value = lines[attribute];
          // If the attribute is in attributesToComment, prepend "//"
          if (attributesToComment.includes(attribute)) {
            value = commentString + " " + value;
            extractedAttributes.unshift(value); // Add the value of the attribute to the result list
          } else {
            extractedAttributes.push(value); // Add the value of the attribute to the result list
          }
          
        }
    }
    return extractedAttributes
  }

  validateJSON(json, requiredAttributes) {
    if (json == null) {
        return false;
    }
    
    // Check if all required attributes are present in the JSON object
    for (let attribute of requiredAttributes) {
        if (!json.hasOwnProperty(attribute)) {
            return false;
        }
    }
    
    return true;
}


  loadJSON(str) {
    let json;
    try {
      json = JSON.parse(str);
    } catch (e) {
      return null;
    }
    return json
  }
}

module.exports = JSONResponseHandler;
