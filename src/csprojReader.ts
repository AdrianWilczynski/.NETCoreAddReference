import * as vscode from 'vscode';
import { matchMany } from './regexUtils';
import { toAbsolutePaths } from './pathUtils';

export async function readCurrentReferences(csprojPath: string) {
    const documentText = (await vscode.workspace.openTextDocument(csprojPath))
        .getText();

    const references = matchReferences(documentText);

    return toAbsolutePaths(references, csprojPath);
}

function matchReferences(documentText: string) {
    return matchMany(documentText, /<ProjectReference Include="([^"]+)" *\/>/g)
        .map(m => m[1]);
}