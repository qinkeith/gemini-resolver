const vscode = require('vscode');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const diff3 = require('diff3');

let statusBarItem;

async function activate(context) {
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'ai-resolver.resolveCurrentConflict';
    context.subscriptions.push(statusBarItem);

    context.subscriptions.push(vscode.commands.registerCommand('ai-resolver.resolveCurrentConflict', resolveCurrentConflict));
    
    vscode.window.onDidChangeActiveTextEditor(updateStatusBar);
    vscode.workspace.onDidChangeTextDocument(updateStatusBar);
    
    updateStatusBar();
}

async function resolveCurrentConflict() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const doc = editor.document;
    const text = doc.getText();
    const conflicts = findConflicts(text);
    
    if (conflicts.length === 0) {
        vscode.window.showInformationMessage('No merge conflicts found in current file');
        return;
    }

    const apiKey = await getApiKey();
    const apiModel = await getApiModel();

    if (!apiKey) return;
    if (!apiModel) return;

    try {
        const resolvedText = await resolveConflictsWithAI(text, conflicts, apiKey, apiModel);
        const fullRange = new vscode.Range(
            doc.positionAt(0),
            doc.positionAt(text.length)
        );
        await editor.edit(editBuilder => {
            editBuilder.replace(fullRange, resolvedText);
        });
        vscode.window.showInformationMessage('Resolved merge conflicts using AI!');
    } catch (error) {
        vscode.window.showErrorMessage(`AI Resolution failed: ${error.message}`);
    }
}

/*************  ✨ Codeium Command ⭐  *************/
   
/******  081d273e-7e02-44a4-97a8-e5ae4b1ff346  *******/
async function resolveConflictsWithAI(originalText, conflicts, apiKey, apiModel) {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: apiModel });

    let resolvedText = originalText;
    for (const conflict of conflicts) {
        const prompt = `Resolve this git merge conflict. Provide ONLY the final resolved code with no explanations.
Current changes (HEAD):
${conflict.ours}
---
Incoming changes:
${conflict.theirs}
---
Common ancestor:
${conflict.base}`;

        vscode.window.showInformationMessage(prompt);
        const result = await model.generateContent(prompt);
        const resolved = await result.response.text();
        
        resolvedText = resolvedText.replace(conflict.fullMatch, resolved.trim());
        //resolvedText = resolvedText.replace(/^```[\w]*[\r]*\n|```$/g, '');
    }
    return resolvedText;
}

function findConflicts(text) {
    const conflictRegex = /<<<<<<<.*?\n(.*?)[\r]*\n=======[\r]*\n(.*?)\n>>>>>>>.*?(\n|$)/gs;
    const conflicts = [];
    let match;

    while ((match = conflictRegex.exec(text)) !== null) {
        const [fullMatch, ours, theirs] = match;
        const base = findCommonAncestor(ours, theirs);
        conflicts.push({
            fullMatch,
            ours,
            theirs,
            base
        });
    }
    return conflicts;
}

function findCommonAncestor(ours, theirs) {
    try {
        const merged = diff3.merge(ours, theirs, '');
        return merged.conflict ? merged.common : '';
    } catch {
        return '';
    }
}

async function getApiKey() {
    const config = vscode.workspace.getConfiguration('geminiResolver');
    let apiKey = config.get('apiKey');

    if (!apiKey) {
        apiKey = await vscode.window.showInputBox({
            prompt: 'Enter your Google AI API Key',
            ignoreFocusOut: true
        });
        
        if (apiKey) {
            await config.update('apiKey', apiKey, vscode.ConfigurationTarget.Global);
        }
    }
    return apiKey;
}

async function getApiModel() {
    const config = vscode.workspace.getConfiguration('geminiResolver');
    let model = config.get('model');

    if (!model) {
        model = await vscode.window.showInputBox({
            prompt: 'Enter your Google AI Model',
            ignoreFocusOut: true
        });
        
        if (model) {
            await config.update('model', model, vscode.ConfigurationTarget.Global);
        }
    }
    return model;
}

function updateStatusBar() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        statusBarItem.hide();
        return;
    }

    const text = editor.document.getText();
    const hasConflicts = findConflicts(text).length > 0;
    
    if (hasConflicts) {
        statusBarItem.text = '$(wand) Resolve Merge Conflicts with AI';
        statusBarItem.show();
    } else {
        statusBarItem.hide();
    }
}

exports.activate = activate;

function deactivate() {}

module.exports = {
    activate,
    deactivate
};