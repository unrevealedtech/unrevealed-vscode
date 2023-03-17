import * as vscode from 'vscode';
import { readToken } from './auth';
import { Configs, loadConfigs } from './config';
import { featureHoverProvider } from './featureHoverProvider';

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
            if (!token) {
              return;
            }
            return featureHoverProvider(context, document, position, {
              token,
              configs,
            });
          },
        },
      ),
    );
  });

  await load();
}
