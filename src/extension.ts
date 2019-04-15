import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as util from 'util';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.commands.registerCommand('extension.addReference', addReference));
}

async function addReference(uri: vscode.Uri) {
	const otherCsprojs = await getOtherCsprojs(uri.fsPath);
	const currentReferences = await getCurrentReferences(uri.fsPath);

	if (otherCsprojs.length === 0 && currentReferences.length === 0) {
		vscode.window.showWarningMessage('Unable to find any other projects in this workspace or project references in this .csproj file.');
		return;
	}

	const references = await showQuickPick(otherCsprojs, currentReferences);
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
	const referenceOutsideOfWorkspace = currentReferences.filter(r => !csprojs.includes(r));

	const allReferences = [...csprojs, ...referenceOutsideOfWorkspace];

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

function getReferencesForAdd(selection: vscode.QuickPickItem[], currentReferences: string[]) {
	return selection.filter(s => !currentReferences.includes(s.detail!))
		.map(s => s.detail!);
}

function getReferencesForRemove(selection: vscode.QuickPickItem[], currentReferences: string[]) {
	return currentReferences.filter(c => !selection.some(s => s.detail === c));
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

	const references = readReferences(documentText);

	return toAbsolutePaths(references, csproj);
}

function readReferences(documentText: string) {
	return matchMany(documentText, /<ProjectReference Include="([^"]+)" *\/>/g)
		.map(m => m[1]);
}

function matchMany(text: string, pattern: RegExp) {
	const matches: RegExpExecArray[] = [];

	let match: RegExpExecArray | null;
	while (match = pattern.exec(text)) {
		matches.push(match);
	}

	return matches;
}

function toAbsolutePaths(paths: string[], relativeTo: string) {
	return paths.map(p => path.resolve(path.dirname(relativeTo), p));
}

export function deactivate() { }