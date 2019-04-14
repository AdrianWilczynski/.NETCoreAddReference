import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.commands.registerCommand('extension.addReference', addReference));
}

async function addReference(uri: vscode.Uri) {
	const csprojs = (await vscode.workspace.findFiles('**/*.csproj'))
		.map(c => c.fsPath)
		.filter(c => c !== uri.fsPath);

	if (csprojs.length === 0) {
		return;
	}

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

	const target = selection.map(p => `"${p.detail}"`).join(' ');

	cp.exec(`dotnet add "${uri.fsPath}" reference ${target}`, (err, stdout, stderr) => {
		if (stdout) {
			vscode.window.showInformationMessage(stdout);
		}
		if (stderr) {
			vscode.window.showWarningMessage(stderr);
		}
	});
}

export function deactivate() { }
