/* eslint-disable no-unused-vars */
const Response = require("./responseService")

class StandardResponse extends Response {

  constructor() {
    super()
  }

  /**
   * Returns response ID
   * @returns string of responseId
   */
  static get responseId() {
    return "standard";
  }

  /**
   * Return model response without modification
   * @param {string} text 
   * @returns {string} text list
   */
  extractLines(text, requiredAttributes, attributesToComment, commentString) {
    return text.split('\n')
  }

}

module.exports = StandardResponse;
