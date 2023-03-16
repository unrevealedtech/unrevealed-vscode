import * as tsutils from 'tsutils';
import * as ts from 'typescript';
import * as vscode from 'vscode';
import { readToken } from './auth';
import { Configs, loadConfigs } from './config';

const languages = [
  'javascript',
  'javascriptreact',
  'typescript',
  'typescriptreact',
];

export async function activate(context: vscode.ExtensionContext) {
  let token: string | null = null;
  let configs: Configs = {};

  async function load() {
    token = await readToken();
    if (token) {
      configs = await loadConfigs(token);
    }
  }

  context.subscriptions.push(
    vscode.commands.registerCommand('unrevealed-vscode.reload', async () => {
      await load();
    }),
  );

  languages.forEach((language) => {
    context.subscriptions.push(
      vscode.languages.registerHoverProvider(
        { scheme: 'file', language },
        {
          provideHover(document, position) {
            const offset = document.offsetAt(position);
            const sourceCode = document.getText();

            const ast = ts.createSourceFile(
              'temp.ts',
              sourceCode,
              ts.ScriptTarget.Latest,
            );
            const hoveredNode = tsutils.getAstNodeAtPosition(ast, offset);

            if (!hoveredNode || !ts.isStringLiteral(hoveredNode)) {
              return;
            }

            const configKey = Object.keys(configs).find(
              (key) => document.fileName.indexOf(key) === 0,
            );

            if (!configKey) {
              return;
            }

            const config = configs[configKey];

            const { features } = config.product;

            const feature = features.find((f) => f.key === hoveredNode.text);

            if (!feature) {
              return;
            }

            if (feature) {
              return new vscode.Hover(`**Feature:** ${feature.name}`);
            }
          },
        },
      ),
    );
  });

  await load();
}
