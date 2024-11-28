function extractLogStatement(str) {
      const regex = /"log_statement":\s*"([^"\\]*(\\.[^"\\]*)*)"/;
      const match = str.match(regex);
      
      if (match) {
        const logStatementValue = match[1].replace(/\\"/g, '"');
        return logStatementValue
      } else {
        return str
      }
} 

function extractLogReason(str) {
    const regex = /"reason":\s*"([^"\\]*(\\.[^"\\]*)*)"/;
    const match = str.match(regex);
    
    if (match) {
      const logReasonValue = match[1].replace(/\\"/g, '"');
      return logReasonValue
    } else {
      return str
    }
} 

function extractLog(str, tabulation) {
    const tabs = '\t'.repeat(tabulation);
    if (str.includes('"log_statement":') && str.includes('"reason":')){
        return "// " + extractLogReason(str) + "\n" + tabs + extractLogStatement(str)
    } else {
        return str
    }
}

module.exports = {extractLog};