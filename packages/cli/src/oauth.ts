import { execFile , spawn } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { lstat, mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { homedir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

import { UsageError } from './errors.js';

const execFileAsync = promisify(execFile);
const SCOPES = 'mcp.read mcp.write';
const LOGIN_TIMEOUT_MS = 5 * 60 * 1000;

type CredentialStore = Record<string, StoredGrant>;

interface LiveGrant {
  accessToken: string;
  expiresAt: number;
  stored: StoredGrant;
}

interface StoredGrant {
  apiBase: string;
  clientId: string;
  refreshToken: string;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  refresh_token?: string;
}

export function apiBaseUrl(): string {
  const raw = process.env.TEACHFLUENCE_API_URL ?? 'https://api.teachfluence.com';
  const url = new URL(raw);

  if (
    (url.protocol !== 'https:' &&
      !(url.protocol === 'http:' && ['127.0.0.1', '[::1]', 'localhost'].includes(url.hostname))) ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    throw new UsageError('TEACHFLUENCE_API_URL must be HTTPS (or local loopback HTTP), with no credentials or query.');
  }

  return url.origin;
}

export function pkceChallenge(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url');
}

function credentialsPath(): string {
  const configRoot = process.env.XDG_CONFIG_HOME ?? path.join(homedir(), '.config');

  return path.join(configRoot, 'teachfluence', 'cli-credentials.json');
}

function grantKey(apiBase: string, organizationSlug: string): string {
  return `${apiBase}|${organizationSlug}`;
}

async function securePath(filePath: string, isDirectory: boolean): Promise<void> {
  if (process.platform === 'win32') {
    // Node's POSIX mode bits do not secure a file on Windows. Remove inherited
    // and explicit ACLs, then grant only this account before a token is written.
    const { stdout } = await execFileAsync('whoami');
    const principal = stdout.trim();

    if (!principal) throw new Error('Could not identify the current Windows account.');

    await execFileAsync('icacls', [filePath, '/reset']);
    await execFileAsync('icacls', [filePath, '/inheritance:r']);
    await execFileAsync('icacls', [filePath, '/grant:r', `${principal}:(F)`]);

    return;
  }

  const info = await stat(filePath);
  const allowed = isDirectory ? 0o700 : 0o600;

  if ((info.mode & 0o777) !== allowed) {
    const { chmod } = await import('node:fs/promises');
    await chmod(filePath, allowed);
  }
}

async function readStore(): Promise<CredentialStore> {
  const filePath = credentialsPath();

  try {
    const info = await lstat(filePath);

    if (!info.isFile() || info.isSymbolicLink()) {
      throw new UsageError('CLI credential path must be a regular file.');
    }

    await securePath(filePath, false);

    return JSON.parse(await readFile(filePath, 'utf8')) as CredentialStore;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return {};

    throw error;
  }
}

async function writeStore(store: CredentialStore): Promise<void> {
  const filePath = credentialsPath();
  const directory = path.dirname(filePath);
  await mkdir(directory, { mode: 0o700, recursive: true });
  const directoryInfo = await lstat(directory);

  if (!directoryInfo.isDirectory() || directoryInfo.isSymbolicLink()) {
    throw new UsageError('CLI credential directory must be a regular directory.');
  }

  await securePath(directory, true);
  const temporary = `${filePath}.${randomBytes(8).toString('hex')}.tmp`;

  try {
    await writeFile(temporary, JSON.stringify(store), { flag: 'wx', mode: 0o600 });
    await securePath(temporary, false);
    await rename(temporary, filePath);
  } catch (error) {
    const { rm } = await import('node:fs/promises');
    await rm(temporary, { force: true });

    throw error;
  }
}

export async function forgetCredential(apiBase: string, organizationSlug: string): Promise<void> {
  const store = await readStore();
  delete store[grantKey(apiBase, organizationSlug)];
  await writeStore(store);
}

async function tokenRequest(apiBase: string, fields: Record<string, string>): Promise<TokenResponse> {
  const response = await fetch(`${apiBase}/mcp/oauth/token`, {
    body: new URLSearchParams(fields),
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    method: 'POST',
  });
  const payload = (await response.json()) as Partial<TokenResponse> & {
    error?: string;
    error_description?: string;
  };

  if (!response.ok) {
    throw new Error(`OAuth token request failed: ${payload.error_description ?? payload.error ?? `HTTP ${response.status}`}`);
  }
  if (payload.token_type?.toLowerCase() !== 'bearer' || !payload.access_token || !payload.expires_in) {
    throw new Error('OAuth server returned an incomplete bearer token response.');
  }

  return payload as TokenResponse;
}

function openBrowser(url: string): void {
  const command = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'rundll32' : 'xdg-open';
  const args = process.platform === 'win32' ? ['url.dll,FileProtocolHandler', url] : [url];
  const child = spawn(command, args, { detached: true, stdio: 'ignore' });
  child.on('error', () => {
    // The URL is printed below so headless shells can open it manually.
  });
  child.unref();
}

async function browserLogin(apiBase: string): Promise<LiveGrant> {
  const verifier = randomBytes(32).toString('base64url');
  const state = randomBytes(32).toString('base64url');
  let onCallback!: (value: URL) => void;
  let onFailure!: (reason: Error) => void;
  const callback = new Promise<URL>((resolve, reject) => {
    onCallback = resolve;
    onFailure = reject;
  });
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1');

    if (request.method !== 'GET' || url.pathname !== '/callback') {
      response.writeHead(404).end();

      return;
    }
    // The listener is loopback-only. An unsolicited browser request cannot
    // provide the random state, and no code or token is shown in the page.
    if (url.searchParams.get('state') !== state) {
      response.writeHead(400).end('Authorization state mismatch.');

      return;
    }
    if (url.searchParams.get('iss') !== apiBase) {
      response.writeHead(400).end('Authorization issuer mismatch.');
      onFailure(new Error('OAuth issuer mismatch. Sign-in was not accepted.'));

      return;
    }

    response.writeHead(200, { 'cache-control': 'no-store', 'content-type': 'text/plain; charset=utf-8' });
    response.end('Teachfluence CLI sign-in completed. You may close this tab.');
    onCallback(url);
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();

  if (!address || typeof address === 'string') throw new Error('Could not start local OAuth callback.');

  const redirectUri = `http://127.0.0.1:${address.port}/callback`;
  let timeout: NodeJS.Timeout | undefined;

  try {
    const register = await fetch(`${apiBase}/mcp/oauth/register`, {
      body: JSON.stringify({
        client_name: 'Teachfluence CLI',
        grant_types: ['authorization_code', 'refresh_token'],
        redirect_uris: [redirectUri],
        response_types: ['code'],
        token_endpoint_auth_method: 'none',
      }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    });
    const registration = (await register.json()) as { client_id?: string; error_description?: string };

    if (!register.ok || !registration.client_id) {
      throw new Error(`CLI OAuth registration failed: ${registration.error_description ?? `HTTP ${register.status}`}. The backend must allow http://127.0.0.1:* callback URIs.`);
    }

    const authorize = new URL(`${apiBase}/mcp/oauth/authorize`);
    authorize.search = new URLSearchParams({
      client_id: registration.client_id,
      code_challenge: pkceChallenge(verifier),
      code_challenge_method: 'S256',
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: SCOPES,
      state,
    }).toString();
    console.log(`Open this URL to authorize Teachfluence CLI:\n${authorize}`);
    openBrowser(authorize.toString());
    timeout = setTimeout(() => onFailure(new Error('Browser sign-in timed out after five minutes.')), LOGIN_TIMEOUT_MS);

    const returned = await callback;

    if (returned.searchParams.get('iss') !== apiBase) {
      throw new Error('OAuth issuer mismatch. Sign-in was not accepted.');
    }

    const refusal = returned.searchParams.get('error');

    if (refusal) throw new Error(`Browser sign-in was refused: ${refusal}.`);

    const code = returned.searchParams.get('code');

    if (!code) throw new Error('Browser sign-in returned no authorization code.');

    const tokens = await tokenRequest(apiBase, {
      client_id: registration.client_id,
      code,
      code_verifier: verifier,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    });

    if (!tokens.refresh_token) throw new Error('OAuth server did not grant a refresh token.');

    return {
      accessToken: tokens.access_token,
      expiresAt: Date.now() + tokens.expires_in * 1000,
      stored: { apiBase, clientId: registration.client_id, refreshToken: tokens.refresh_token },
    };
  } finally {
    if (timeout) clearTimeout(timeout);

    server.close();
  }
}

/** One provider per command. Refresh tokens never enter argv, logs, or chat. */
export async function browserCredential(
  apiBase: string,
  organizationSlug: string,
): Promise<() => Promise<string>> {
  const store = await readStore();
  const key = grantKey(apiBase, organizationSlug);
  let live: LiveGrant | null = null;
  const saved = store[key];

  if (saved) {
    try {
      const tokens = await tokenRequest(apiBase, {
        client_id: saved.clientId,
        grant_type: 'refresh_token',
        refresh_token: saved.refreshToken,
      });
      live = {
        accessToken: tokens.access_token,
        expiresAt: Date.now() + tokens.expires_in * 1000,
        stored: { ...saved, refreshToken: tokens.refresh_token ?? saved.refreshToken },
      };
    } catch {
      // A revoked grant needs a fresh consent. Do not print the stored token.
      delete store[key];
    }
  }

  live ??= await browserLogin(apiBase);
  store[key] = live.stored;
  await writeStore(store);

  return async () => {
    if (!live) throw new Error('CLI OAuth grant is unavailable.');
    if (live.expiresAt - Date.now() < 60_000) {
      const tokens = await tokenRequest(apiBase, {
        client_id: live.stored.clientId,
        grant_type: 'refresh_token',
        refresh_token: live.stored.refreshToken,
      });
      live = {
        accessToken: tokens.access_token,
        expiresAt: Date.now() + tokens.expires_in * 1000,
        stored: {
          ...live.stored,
          refreshToken: tokens.refresh_token ?? live.stored.refreshToken,
        },
      };
      store[key] = live.stored;
      await writeStore(store);
    }

    return live.accessToken;
  };
}
