import * as fs from 'fs-extra';
import * as path from 'path';
import * as vscode from 'vscode';
import { fetchProduct, ProductQueryResult } from './graphql';

type Product = ProductQueryResult['product'];
export interface Config {
  product: Product;
}
export type Configs = Record<string, Config>;

async function findConfigFiles() {
  try {
    return await vscode.workspace.findFiles(
      '**/unrevealed.config.json',
      '**/.git,**/node_modules',
    );
  } catch (err) {
    console.debug(err);
    return [];
  }
}

export async function loadConfigs(token: string): Promise<Configs> {
  const configFiles = await findConfigFiles();

  const configs: Record<string, { product: ProductQueryResult['product'] }> =
    {};

  await Promise.all(
    configFiles.map(async (configFile) => {
      try {
        const config = await fs.readJSON(configFile.path);
        const { productId } = config;

        const product = await fetchProduct(productId, token);

        if (!product) {
          return;
        }

        configs[path.dirname(configFile.path)] = { product };
      } catch (err) {
        console.debug(err);
        vscode.window.showErrorMessage(
          `Unrevealed: Error loading config at ${configFile.path}`,
        );
        return null;
      }
    }),
  );

  return configs;
}
