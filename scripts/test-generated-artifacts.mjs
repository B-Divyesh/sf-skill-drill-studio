import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const dist = join(process.cwd(), 'dist');
const immutable = 'public, max-age=31536000, immutable';
const revalidate = 'public, max-age=0, must-revalidate';

function filesBelow(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesBelow(path) : [path];
  });
}

assert.ok(existsSync(join(dist, 'index.html')), 'build must emit dist/index.html');
const config = JSON.parse(readFileSync(join(dist, 'staticwebapp.config.json'), 'utf8'));
const routes = config.routes ?? [];
const route = (pattern) => routes.find((item) => item.route === pattern);

assert.equal(
  route('/assets/*.{js,css}')?.headers?.['Cache-Control'],
  immutable,
  'fingerprinted JavaScript and CSS must receive an immutable one-year cache policy',
);
assert.equal(
  route('/sw.js')?.headers?.['Cache-Control'],
  revalidate,
  'the service worker must be checked for updates on every request',
);
assert.equal(
  route('/*')?.headers?.['Cache-Control'],
  revalidate,
  'the HTML app shell and fallback routes must revalidate',
);

const generated = filesBelow(join(dist, 'assets')).filter((file) => /\.(?:js|css)$/.test(file));
assert.ok(generated.length > 0, 'build must emit JavaScript or CSS assets');
for (const file of generated) {
  const name = relative(join(dist, 'assets'), file).replaceAll('\\', '/');
  assert.match(
    name,
    /(?:^|\/)[^/]+-[A-Za-z0-9_-]{8,}\.(?:js|css)$/,
    `generated asset must be content hashed before it can use immutable caching: ${name}`,
  );
}

const html = readFileSync(join(dist, 'index.html'), 'utf8');
const referencedBundles = [...html.matchAll(/(?:src|href)="(\/assets\/[^"?#]+\.(?:js|css))"/g)].map((match) => match[1]);
assert.ok(referencedBundles.length > 0, 'the app shell must reference generated JavaScript or CSS');
for (const asset of referencedBundles) {
  assert.match(asset, /-[A-Za-z0-9_-]{8,}\.(?:js|css)$/, `app shell bundle must be content hashed: ${asset}`);
}

console.log(`Generated-artifact cache policy passed for ${generated.length} hashed JS/CSS file(s).`);
