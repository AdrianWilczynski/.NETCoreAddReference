import * as vscode from 'vscode';
import * as path from 'path';

export async function showQuickPick(csprojs: string[], currentReferences: string[]) {
    const allReferences = getAllReferences(csprojs, currentReferences);

    const picks = allReferences.map<vscode.QuickPickItem>(c => {
        return {
            label: path.basename(c, path.extname(c)),
            detail: c,
            picked: currentReferences.includes(c)
        };
    });

    const selection = await vscode.window.showQuickPick(picks, { canPickMany: true });
    if (!selection) {
        return;
    }

    return {
        add: getReferencesForAdd(selection, currentReferences),
        remove: getReferencesForRemove(selection, currentReferences)
    };
}

function getAllReferences(csprojs: string[], currentReferences: string[]) {
    const referenceOutsideOfWorkspace = currentReferences.filter(r => !csprojs.includes(r));
    return [...csprojs, ...referenceOutsideOfWorkspace];
}

function getReferencesForAdd(selection: vscode.QuickPickItem[], currentReferences: string[]) {
    return selection.filter(s => !currentReferences.includes(s.detail!))
        .map(s => s.detail!);
}

function getReferencesForRemove(selection: vscode.QuickPickItem[], currentReferences: string[]) {
    return currentReferences.filter(c => !selection.some(s => s.detail === c));
}