/* eslint-disable no-unused-vars */
// Abstract Base Class
class Response {

    constructor() {
        if (new.target === Response) {
            throw new Error("Cannot instantiate abstract class ApiModelService directly.");
        }
    }

    /**
     * Returns response ID
     * @returns string of responseId
     */
    static get responseId() {
        return "";
      }

    /**
 * extract content form text, as list, each line is one item in list
 * @param {string} text 
 * @param {Array} requiredAttributes Attributes to find
 * @param {Array} attributesToComment List of attributes where the comment string should be added
 * @param {string} commentString Comment string to add
 */
    extractLines(text, requiredAttributes, attributesToComment, commentString) {
        throw new Error("Method 'extractLines()' must be implemented.");
    }

}

module.exports = Response;
