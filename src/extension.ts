import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as util from 'util';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.commands.registerCommand('extension.addReference', addReference));
}

async function addReference(uri: vscode.Uri) {
	const csprojs = await getOtherCsprojs(uri.fsPath);
	if (csprojs.length === 0) {
		return;
	}

	const currentReferences = await getCurrentReferences(uri.fsPath);

	const references = await showQuickPick(csprojs, currentReferences);
	if (!references) {
		return;
	}

	if (references.add.length > 0) {
		await execCliCommand('add', uri.fsPath, references.add);
	}
	if (references.remove.length > 0) {
		await execCliCommand('remove', uri.fsPath, references.remove);
	}
}

async function getOtherCsprojs(csproj: string) {
	return (await vscode.workspace.findFiles('**/*.csproj'))
		.map(c => c.fsPath)
		.filter(c => c !== csproj);
}

async function showQuickPick(csprojs: string[], currentReferences: string[]) {
	const picks = csprojs.map<vscode.QuickPickItem>(c => {
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
		add: selection.filter(s => !currentReferences.includes(s.detail as string))
			.map(s => s.detail as string),
		remove: currentReferences.filter(c => !selection.some(s => s.detail === c))
	};
}

async function execCliCommand(command: 'add' | 'remove', project: string, projectReferences: string[]) {
	const exec = util.promisify(cp.exec);

	const target = projectReferences.map(t => `"${t}"`).join(' ');
	const output = await exec(`dotnet ${command} "${project}" reference ${target}`);

	if (output.stdout) {
		vscode.window.showInformationMessage(output.stdout);
	}
	if (output.stderr) {
		vscode.window.showWarningMessage(output.stderr);
	}
}

async function getCurrentReferences(csproj: string) {
	const documentText = (await vscode.workspace.openTextDocument(csproj))
		.getText();

	const regex = /<ProjectReference Include="([^"]+)" *\/>/g;

	const references: string[] = [];

	let match: RegExpExecArray | null;
	while (match = regex.exec(documentText)) {
		references.push(match[1]);
	}

	return references.map(r => path.resolve(path.dirname(csproj), r));
}

export function deactivate() { }