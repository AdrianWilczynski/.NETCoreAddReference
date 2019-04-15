import * as vscode from 'vscode';
import { getOtherCsprojs, getCurrentCsprojPath } from './env';
import { readCurrentReferences } from './csprojReader';
import { showQuickPick } from './quickPick';
import { execReferenceCommand } from './cliExecutor';

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('extension.addReference', addReference));
}

async function addReference(uri: vscode.Uri | undefined) {
    const csprojPath = getCurrentCsprojPath(uri);
    if (!csprojPath) {
        return;
    }

    const otherCsprojs = await getOtherCsprojs(csprojPath);
    const currentReferences = await readCurrentReferences(csprojPath);

    if (otherCsprojs.length === 0 && currentReferences.length === 0) {
        vscode.window.showWarningMessage('Unable to find any other projects in this workspace or project references in this .csproj file.');
        return;
    }

    const references = await showQuickPick(otherCsprojs, currentReferences);
    if (!references) {
        return;
    }

    if (references.add.length > 0) {
        await execReferenceCommand('add', csprojPath, references.add);
    }
    if (references.remove.length > 0) {
        await execReferenceCommand('remove', csprojPath, references.remove);
    }
}

export function deactivate() { }