const Response = require("./responseService");

class RegexResponse extends Response {
  constructor() {
    super();
  }

  /**
   * Returns response ID
   * @returns string of responseId
   */
  static get responseId() {
    return "regex";
  }

  /**
   *
   * @param {string} text Text to parse
   * @param {string[]} requiredAttributes Attributes required to
   * @param {string[]} attributesToComment List of attributes to comment
   * @param {string} commentString comment string Ex: "//" in Java
   * @returns {string[]} List of string 
   */
  extractLines(text, requiredAttributes, attributesToComment, commentString) {
    let extractedAttributes = [];
    const regex = /"([^"]+)":\s*"((?:[^"\\]|\\.)*)"/g; // Regex to match key-value pairs in JSON

    let match;
    const foundAttributes = new Set();

    while ((match = regex.exec(text)) !== null) {
      let key = match[1]; // Extracted key
      let value = match[2]; // Extracted value

      // If the key is in the requiredAttributes list, add its value to the result list
      if (requiredAttributes.includes(key)) {
        value = value.replace(/\\"/g, '"')
        if (attributesToComment.includes(key)) {
          value = commentString + " " + value;
          extractedAttributes.unshift(value);
        } else {
          extractedAttributes.push(value);
        }
        
        foundAttributes.add(key); // Mark this key as found
      }
    }

    // If not all required attributes were found, return an empty list
    for (let attr of requiredAttributes) {
      if (!foundAttributes.has(attr)) {
        return []; // Return empty list if any required attribute is missing
      }
    }

    return extractedAttributes;
  }
}

module.exports = RegexResponse;
