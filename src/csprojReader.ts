import * as vscode from 'vscode';
import { matchMany } from './regexUtils';
import { toAbsolutePath, normalizePath } from './pathUtils';

export async function readCurrentReferences(csprojPath: string) {
    const documentText = (await vscode.workspace.openTextDocument(csprojPath))
        .getText();

    return matchReferences(documentText)
        .map(r => toAbsolutePath(r, csprojPath))
        .map(normalizePath);
}

function matchReferences(documentText: string) {
    return matchMany(documentText, /<ProjectReference Include="([^"]+)" *\/>/g)
        .map(m => m[1]);
}