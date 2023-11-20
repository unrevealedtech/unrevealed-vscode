import * as tsutils from 'tsutils';
import * as ts from 'typescript';
import * as vscode from 'vscode';

import { Configs } from './config';
import { fetchFeature } from './graphql';

interface FeatureOverOptions {
  token: string;
  configs: Configs;
}

export async function featureHoverProvider(
  context: vscode.ExtensionContext,
  document: vscode.TextDocument,
  position: vscode.Position,
  { token, configs }: FeatureOverOptions,
) {
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

  const foundFeature = features.find((f) => f.key === hoveredNode.text);

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
      .toLowerCase()}-${feature.featureStage.color.replace('#', '')}.svg`,
  );

  const content = new vscode.MarkdownString();

  content.supportHtml = true;

  content.appendMarkdown(`**${feature.name}** - `);
  content.appendMarkdown(
    `<span style="color:#000;background-color:${feature.featureStage.color};">&nbsp;**${feature.featureStage.name}**&nbsp;</span>`,
  );
  if (feature.description) {
    content.appendMarkdown(`\n\n${feature.description}`);
  }
  content.appendMarkdown(
    `\n\n[Open in Unrevealed](https://app.unrevealed.tech/product/${product.id}/feature/${feature.id})`,
  );
  content.supportHtml = true;

  return new vscode.Hover(content);
}
