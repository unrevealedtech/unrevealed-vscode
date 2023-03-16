import appDirs from 'appdirsjs';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as vscode from 'vscode';
import { fetchProduct, ProductQueryResult } from './graphql';

const dataDir = appDirs({ appName: 'unrevealed' }).data;
const globalConfigFile = path.join(dataDir, 'config.json');

export async function readToken() {
  try {
    const globalConfig = await fs.readJSON(globalConfigFile);
    return globalConfig.token;
  } catch (err) {
    vscode.window
      .showErrorMessage('Unrevealed: unauthorized', 'Login')
      .then((selection) => {
        if (selection === 'Login') {
          vscode.window.showInformationMessage('LOGIN');
        }
      });
    return null;
  }
}

type Product = ProductQueryResult['product'];
export interface Config {
  product: Product;
}
export type Configs = Record<string, Config>;

export async function loadConfigs(): Promise<Configs> {
  const token = await readToken();
  if (!token) {
    return {};
  }

  const configFiles = await vscode.workspace.findFiles(
    '**/unrevealed.config.json',
    '**/.git,**/node_modules',
  );

  const configs: Record<string, { product: ProductQueryResult['product'] }> =
    {};

  await Promise.all(
    configFiles.map(async (configFile) => {
      try {
        const config = await fs.readJSON(configFile.path);
        const { productId } = config;

        const product = await fetchProduct(productId, token);

        if (!product) {
          vscode.window.showErrorMessage(
            `Error loading config at ${configFile.path}`,
          );
          return;
        }

        configs[path.dirname(configFile.path)] = { product };
      } catch (err) {
        vscode.window.showErrorMessage(
          `Error loading config at ${configFile.path}`,
        );
      }
    }),
  );

  return configs;
}
