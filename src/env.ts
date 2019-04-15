import * as vscode from 'vscode';

export function getCurrentCsprojPath(uri: vscode.Uri | undefined) {
    if (!uri) {
        if (!vscode.window.activeTextEditor) {
            return;
        }

        const path = vscode.window.activeTextEditor.document.fileName;

        if (!path.endsWith('.csproj')) {
            return;
        }

        return path;
    }

    return uri.fsPath;
}

export async function getOtherCsprojs(csproj: string) {
    return (await vscode.workspace.findFiles('**/*.csproj'))
        .map(c => c.fsPath)
        .filter(c => c !== csproj);
}