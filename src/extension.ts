import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as util from 'util';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.commands.registerCommand('extension.addReference', addReference));
}

async function addReference(uri: vscode.Uri | undefined) {
	const csprojPath = getCurrentCsprojPath(uri);
	if (!csprojPath) {
		return;
	}

	const otherCsprojs = await getOtherCsprojs(csprojPath);
	const currentReferences = await getCurrentReferences(csprojPath);

	if (otherCsprojs.length === 0 && currentReferences.length === 0) {
		vscode.window.showWarningMessage('Unable to find any other projects in this workspace or project references in this .csproj file.');
		return;
	}

	const references = await showQuickPick(otherCsprojs, currentReferences);
	if (!references) {
		return;
	}

	if (references.add.length > 0) {
		await execCliCommand('add', csprojPath, references.add);
	}
	if (references.remove.length > 0) {
		await execCliCommand('remove', csprojPath, references.remove);
	}
}

function getCurrentCsprojPath(uri: vscode.Uri | undefined) {
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

	let infoMessage: string | undefined;
	let errorMessage: string | undefined;

	try {
		const output = await exec(`dotnet ${command} "${project}" reference ${target}`);

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