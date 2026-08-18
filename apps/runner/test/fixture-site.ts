import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

// a fixture site with a known shape, served locally. the counts here are what
// the capture test asserts against, so a change to the markup is a change to
// the expectations.
export const FIXTURE_DOM_NODES = 12;
export const FIXTURE_SCRIPT_BYTES = 4096;
export const FIXTURE_THIRD_PARTY_BYTES = 2048;

function page(thirdPartyOrigin: string): string {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Fixture</title>
<link rel="stylesheet" href="/style.css">
</head>
<body>
<header><h1>Fixture</h1></header>
<main><p>Un</p><p>Deux</p></main>
<script src="/app.js"></script>
<script src="${thirdPartyOrigin}/tag.js"></script>
</body>
</html>`;
}

export interface FixtureSite {
  origin: string;
  close: () => Promise<void>;
}

function listen(server: Server): Promise<number> {
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve((server.address() as AddressInfo).port);
    });
  });
}

function close(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => (error === undefined ? resolve() : reject(error)));
  });
}

/**
 * two origins on one host: the service itself and a third party, so
 * extraction has something real to attribute. served with no-store so a warm
 * pass is a deliberate act rather than an accident of caching headers.
 */
export async function startFixtureSite(): Promise<FixtureSite> {
  const thirdParty = createServer((request, response) => {
    response.writeHead(200, { 'content-type': 'text/javascript', 'cache-control': 'no-store' });
    response.end(`/*${'t'.repeat(FIXTURE_THIRD_PARTY_BYTES - 4)}*/`);
  });
  const thirdPartyPort = await listen(thirdParty);
  const thirdPartyOrigin = `http://127.0.0.1:${thirdPartyPort}`;

  const service = createServer((request, response) => {
    const path = request.url ?? '/';
    if (path === '/app.js') {
      response.writeHead(200, { 'content-type': 'text/javascript', 'cache-control': 'no-store' });
      response.end(`/*${'a'.repeat(FIXTURE_SCRIPT_BYTES - 4)}*/`);
      return;
    }
    if (path === '/style.css') {
      response.writeHead(200, { 'content-type': 'text/css', 'cache-control': 'no-store' });
      response.end('body{margin:0}');
      return;
    }
    response.writeHead(200, { 'content-type': 'text/html', 'cache-control': 'no-store' });
    response.end(page(thirdPartyOrigin));
  });
  const servicePort = await listen(service);

  return {
    origin: `http://localhost:${servicePort}`,
    close: async () => {
      await close(service);
      await close(thirdParty);
    },
  };
}
