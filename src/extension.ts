// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as chokidar from 'chokidar';
import fs from 'fs';
import path from 'path';

const cache: Record<string, any> = {};
const state: any = {
  watcher: null,
  watcherReady: false
};

function updateSnippetsCache(dir: string) {
  Object.keys(cache).forEach(key => {
    cache[key] = '{}';
  });
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const name = file.replace(path.extname(file), '');
    const locate = path.resolve(dir, file);
    cache[name] = fs.readFileSync(locate, 'utf-8');
  });
}

function getSnippetsByLanguage(lang: string) {
  if (cache[lang]) {
    const json = new Function(`return ${cache[lang]}`)();
    const result: any = [];
    Object.keys(json).forEach(key => {
      const item = json[key];
      const prefix = item.prefix;
      const body = item.body;
      const description = item.description;
      const snippet = {
        prefix,
        body,
        description,
        name: key
      };
      result.push(snippet);
    });
    return result;
  } else {
    return [];
  }
}

function watchSnippets(dir: string) {
  if (state.watcher) {
    state.watcher.close();
  }
  state.watcher = chokidar
    .watch(dir)
    .on('ready', () => {
      state.watcherReady = true;
    })
    .on('all', () => {
      if (state.ready) {
        updateSnippetsCache(dir);
      }
    });
}

function matchSnippets(context:string, snippets: any[]) {
  return snippets.find(t => t.prefix.includes(context));
}

async function fallback() {
  await vscode.commands.executeCommand('editor.action.accessibleViewAcceptInlineCompletion');
  if (!isCursorPositionSame()) {return false;}
  await vscode.commands.executeCommand('acceptSelectedCodeAction');
  if (!isCursorPositionSame()) {return false;}
  await vscode.commands.executeCommand('acceptSelectedSuggestion');
  if (!isCursorPositionSame()) {return false;}
  vscode.commands.executeCommand('tab');
}

function isCursorPositionSame() {
    const { line, character } = cache.editor.selection.active;
    return line === cache.line && character === cache.character;
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // console.log(context)
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "combo-tab" is now active!');

  const cacheDirectory = context.globalStorageUri;
  const snippetsDir = path.resolve(cacheDirectory.fsPath, '../../snippets');
  console.log('VS Code 的缓存目录：', snippetsDir);
  updateSnippetsCache(snippetsDir);
  console.log(`已监控 ${snippetsDir} 目录下的文件变化，${Object.keys(cache).join(',')}`);
  watchSnippets(snippetsDir);

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand('combo-tab.tab-listener', async () => {
    // The code you place here will be executed every time your command is executed
    // Display a message box to the user
    const editor = vscode.window.activeTextEditor;
    if (!editor) {return;}
    cache.editor = editor;

    const languageId = editor.document.languageId;
    console.log('当前语言：', languageId);
    const { line, character } = editor.selection.active;
    cache.line = line;
    cache.character = character;
    
    const lineRange = editor.document.lineAt(line).range;
    const textBeforeCursor = editor.document.getText(new vscode.Range(lineRange.start, new vscode.Position(line, character)));
    const text = textBeforeCursor.split(/\s/).reverse().at(0) || '';

    if (!text) {
      console.log('光标左侧没有文本，无法匹配 snippet.');
      return await fallback();
    }

    console.log('当前行光标前的字符串：', text);
    const snippets = getSnippetsByLanguage(languageId);
    console.log(snippets);
    const source = matchSnippets(text, snippets);
    if (!source) {
      return await fallback();
    }
    await editor.edit(editBuilder => {
      // 删除代码段
      const startPosition = new vscode.Position(line, character - text.length);
      const endPosition = new vscode.Position(line, character);
      const range = new vscode.Range(startPosition, endPosition);
      editBuilder.delete(range);
    });
    await vscode.commands.executeCommand("editor.action.insertSnippet", { "name": source.name });
    // vscode.window.showInformationMessage('Hello World from combo-tab!');
  });

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {
  state.watcher.close();
}
