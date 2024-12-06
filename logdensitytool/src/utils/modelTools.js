const vscode = require('vscode');

/**
 * This function finds the attribute in SystemPrompt and replace it with text. 
 * The text is added at the end if not found
 * @param {string} text text to add to system_prompt
 * @param {string} systemPrompt systemPromt
 * @param {string} attribute attribute to foind and replace with text in systemPrompt
 * @returns 
 */
function buildPrompt(text, systemPrompt, attribute) {
    try {
        systemPrompt = String(systemPrompt);
        // Create a dynamic regular expression to match the attribute
        const regex = new RegExp(attribute, 'g'); // 'g' for global replacement
        // Replace the attribute with the content
        if (systemPrompt.includes(attribute)) {
            // Replace the attribute with the content
            const updatedPrompt = systemPrompt.replace(regex, text);
            return updatedPrompt;
        } else {
            // If the attribute is not found, append text at the end
            return systemPrompt + text;
        }
    } catch (error) {
        console.error("Error in build function:", error.message);
        return null;
    }
}

function getSurroundingMethodText(document, lineNumber) {
    let startLine = lineNumber;
    let endLine = lineNumber;

    // Compteur pour suivre les accolades
    let openBraces = 0;

    // Chercher le début de la méthode
    while (startLine > 0) {
        const lineText = document.lineAt(startLine).text.trim();

        // Compter les accolades fermées et ouvertes
        openBraces += (lineText.match(/\}/g) || []).length;
        openBraces -= (lineText.match(/\{/g) || []).length;

        if (openBraces < 0) {
            // Trouvé le début de la méthode
            break;
        }

        startLine--;
    }

    // Réinitialiser le compteur pour chercher la fin
    openBraces = 0;

    // Chercher la fin de la méthode
    while (endLine < document.lineCount - 1) {
        const lineText = document.lineAt(endLine).text.trim();

        // Compter les accolades ouvertes et fermées
        openBraces += (lineText.match(/\{/g) || []).length;
        openBraces -= (lineText.match(/\}/g) || []).length;

        if (openBraces === 0 && lineText.includes('}')) {
            // Trouvé la fin de la méthode
            break;
        }

        endLine++;
    }

    // Récupérer le texte de la méthode complète
    const methodRange = new vscode.Range(startLine, 0, endLine, document.lineAt(endLine).text.length);
    return document.getText(methodRange);
}

/**
 * Extract attribute names before the colon (:) in a JSON-like structure.
 * @param {string} text - The text containing JSON-like structure.
 * @param {string[]} attributesToComment - List of attributes to comment used to reorder list
 * @returns {string[]} - List of attribute names before the colon.
 */
function extractAttributesFromJson(text, attributesToComment) {
    const regex = /{{(.*?)}}/s; // get text between {{ and }}
    const matches = text.match(regex);

    if (matches) {
        text = matches[1].trim()
    }

    const attributes = extractAttributesBeforeColon(text)

    // Reorder the attributes: move attributes in 'attributesToComment' to the front
    const reorderedAttributes = attributes.sort((a, b) => {
        const aInCommentList = attributesToComment.includes(a);
        const bInCommentList = attributesToComment.includes(b);
        // If 'a' is in attributesToComment and 'b' is not, 'a' should come first
        if (aInCommentList && !bInCommentList) return -1;
        if (!aInCommentList && bInCommentList) return 1;
        return 0; // Maintain the order for other cases
    });

    return reorderedAttributes;
}

/**
 * Extract attribute names before the colon (:) from text.
 * @param {string} text - The text containing key-value pairs.
 * @returns {string[]} - List of attribute names.
 */
function extractAttributesBeforeColon(text) {
    const regex = /"(\w+)"\s*:|(\w+)\s*:/g;  // Matches word characters (letters, digits, underscores) followed by a colon.
    const attributes = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
        attributes.push(match[1] || match[2]);  // Add the matched key (before the colon) to the list
    }

    return attributes;
}

module.exports = {
    buildPrompt,
    getSurroundingMethodText,
    extractAttributesFromJson
};