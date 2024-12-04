const Response = require("./response")

class StandardResponse extends Response {

  static responseId = "standard"

  constructor() {
    super()
  }

  /**
   * Return model response without modification
   * @param {string} text 
   * @returns (string) text
   */
  extractLines(text) {
    return text.split('\n')
  }

}

module.exports = StandardResponse;
