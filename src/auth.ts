import appDirs from 'appdirsjs';
import * as fs from 'fs-extra';
import * as http from 'http';
import * as open from 'open';
import * as path from 'path';
import * as url from 'url';
import * as vscode from 'vscode';

import { AUTH_URL, LOGIN_SERVER_PORT, LOGIN_SUCCESS_URL } from './constants';

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
          return login();
        }
      });
    return null;
  }
}

export async function login() {
  try {
    const token = await getToken();

    await writeToken(token);

    vscode.window.showInformationMessage('Unrevealed: Successfully logged in!');
    return token;
  } catch (err) {
    console.debug(err);
    return null;
  }
}

async function writeToken(token: string) {
  await fs.ensureDir(dataDir);
  await fs.writeJSON(globalConfigFile, { token });
}

function getToken(): Promise<string> {
  let server: http.Server;

  const loginPromise = new Promise<string>((resolve, reject) => {
    let success = false;
    const requestListener: http.RequestListener = (req, res) => {
      if (!req.url) {
        res.end();
        return;
      }

      const { query } = url.parse(req.url, true);

      if (typeof query.token !== 'string') {
        res.end();
        return;
      }

      resolve(query.token);
      success = true;

      res.writeHead(302, {
        Location: LOGIN_SUCCESS_URL,
      });

      res.end();

      setImmediate(() => {
        server.close();
      });
    };

    server = http.createServer(requestListener);

    server.listen(LOGIN_SERVER_PORT, () => {
      open(AUTH_URL);
    });
    server.on('close', () => {
      if (!success) {
        reject(new Error('Login cancelled'));
      }
    });
    const timeout = setTimeout(() => {
      if (server.listening) {
        server.close();
      }
    }, 1000);
  });

  vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Window,
      cancellable: true,
      title: 'Unrevealed: Logging in from browser window',
    },
    async (progress, cancellationToken) => {
      cancellationToken.onCancellationRequested(() => {
        if (server) {
          server.close();
        }
      });
      progress.report({ increment: 0 });

      await loginPromise;

      progress.report({ increment: 100 });
    },
  );
  return loginPromise;
}
