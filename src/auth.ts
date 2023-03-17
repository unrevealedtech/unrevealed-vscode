import appDirs from 'appdirsjs';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as vscode from 'vscode';

const dataDir = appDirs({ appName: 'unrevealed' }).data;
const globalConfigFile = path.join(dataDir, 'config.json');

export async function readToken() {
  try {
    const globalConfig = await fs.readJSON(globalConfigFile);
    return globalConfig.token;
  } catch (err) {
    console.debug(err);
    vscode.window
      .showErrorMessage(
        'Unrevealed: unauthorized. Login to start using the extension',
        'Login',
      )
      .then((selection) => {
        if (selection === 'Login') {
          vscode.window.showInformationMessage('LOGIN');
        }
      });
    return null;
  }
}
