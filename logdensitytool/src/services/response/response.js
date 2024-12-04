// Abstract Base Class
class Response {

    static responseId

    constructor() {
        if (new.target === Response) {
        throw new Error("Cannot instantiate abstract class ApiModelService directly.");
        }
    }

    adaptResponse(text) {
        throw new Error("Method 'generate()' must be implemented.");
    }
}

module.exports = Response;
  