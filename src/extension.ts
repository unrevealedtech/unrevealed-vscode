import * as tsutils from 'tsutils';
import * as ts from 'typescript';
import * as vscode from 'vscode';
import { readToken } from './auth';
import { Configs, loadConfigs } from './config';
import { fetchFeature } from './graphql';

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
          async provideHover(document, position) {
            if (!token) {
              return;
            }

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

            const { product } = config;
            const { features } = product;

            const foundFeature = features.find(
              (f) => f.key === hoveredNode.text,
            );

            if (!foundFeature) {
              return;
            }

            const feature = await fetchFeature(foundFeature.id, token);

            if (!feature) {
              return;
            }

            const imageUrl = context.asAbsolutePath(
              `resources/icons/${feature.featureStage.icon
                .replace('_', '-')
                .toLowerCase()}-${feature.featureStage.color.replace(
                '#',
                '',
              )}.svg`,
            );

            const content = new vscode.MarkdownString(
              `**${feature.name}** (${feature.featureStage.name}<img src="${imageUrl}" />)`,
            );

            if (feature.description) {
              content.appendMarkdown(`\n\n${feature.description}`);
            }

            content.appendMarkdown(
              `\n\n[Open in Unrevealed](https://app.unrevealed.tech/product/${product.id}/feature/${feature.id})`,
            );

            content.supportHtml = true;
            return new vscode.Hover(content);
          },
        },
      ),
    );
  });

  await load();
}
