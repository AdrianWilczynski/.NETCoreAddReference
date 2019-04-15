import * as cp from 'child_process';
import * as util from 'util';
import * as vscode from 'vscode';

export async function execReferenceCommand(operation: 'add' | 'remove', project: string, projectReferences: string[]) {
    const target = projectReferences.map(t => `"${t}"`).join(' ');

    await execCommand(`dotnet ${operation} "${project}" reference ${target}`);
}

async function execCommand(command: string) {
    const exec = util.promisify(cp.exec);

    let infoMessage: string | undefined;
    let errorMessage: string | undefined;

    try {
        const output = await exec(command);

        infoMessage = output.stdout;
        errorMessage = output.stderr;
    }
    catch (e) {
        errorMessage = (e as Error).message;
    }

    if (infoMessage) {
        vscode.window.showInformationMessage(infoMessage);
    }
    if (errorMessage) {
        vscode.window.showWarningMessage(errorMessage);
    }
}