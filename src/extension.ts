import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.commands.registerCommand('extension.addReference', addReference));
}

async function addReference(uri: vscode.Uri) {
	const csprojs = await getOtherCsprojs(uri);
	if (csprojs.length === 0) {
		return;
	}

	const projectReferences = await showQuickPick(csprojs);
	if (!projectReferences) {
		return;
	}

	execCliCommand(uri.fsPath, projectReferences);
}

async function getOtherCsprojs(uri: vscode.Uri) {
	return (await vscode.workspace.findFiles('**/*.csproj'))
		.map(c => c.fsPath)
		.filter(c => c !== uri.fsPath);
}

async function showQuickPick(csprojs: string[]) {
	const picks = csprojs.map<vscode.QuickPickItem>(c => {
		return {
			label: path.basename(c, path.extname(c)),
			detail: c
		};
	});

	const selection = await vscode.window.showQuickPick(picks, { canPickMany: true });
	if (!selection || selection.length === 0) {
		return;
	}

	return selection.map(s => s.detail as string);
}

function execCliCommand(project: string, projectReferences: string[]) {
	const target = projectReferences.map(t => `"${t}"`).join(' ');

	cp.exec(`dotnet add "${project}" reference ${target}`, (err, stdout, stderr) => {
		if (stdout) {
			vscode.window.showInformationMessage(stdout);
		}
		if (stderr) {
			vscode.window.showWarningMessage(stderr);
		}
	});
}

export function deactivate() { }
