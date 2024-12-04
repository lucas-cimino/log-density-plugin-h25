const Response = require("./response")

class RegexJavaResponse extends Response {

    static responseId = "regex"
  
    constructor() {
        super()
    }
    
    /**
     * Extract log_statement and reason in model response and 
     * build response
     * @param {string} text Model response
     * @param {int} tabluation tabulation in Code editor
     * @returns {string} built response :
     * 
     *Ex:
        reason\n
        \t\tlog_statement
     */
    adaptResponse(text, tabluation) {
      return this.extractLog(text, tabluation)
    }

    extractLogStatement(str) {
        const regex = /"log_statement":\s*"([^"\\]*(\\.[^"\\]*)*)"/;
        const match = str.match(regex);
        
        if (match) {
          const logStatementValue = match[1].replace(/\\"/g, '"');
          return logStatementValue
        } else {
          return str
        }
    } 
  
  extractLogReason(str) {
      const regex = /"reason":\s*"([^"\\]*(\\.[^"\\]*)*)"/;
      const match = str.match(regex);
      
      if (match) {
        const logReasonValue = match[1].replace(/\\"/g, '"');
        return logReasonValue
      } else {
        return str
      }
    } 
  
    extractLog(str, tabulation) {
      const tabs = '\t'.repeat(tabulation);
      if (str.includes('"log_statement":') && str.includes('"reason":')){
          return "// " + this.extractLogReason(str) + "\n" + tabs + this.extractLogStatement(str)
      } else {
          return str
      }
    }
}

module.exports = RegexJavaResponse;
