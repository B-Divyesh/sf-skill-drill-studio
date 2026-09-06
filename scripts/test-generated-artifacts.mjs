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
  route('/')?.headers?.['Cache-Control'],
  revalidate,
  'the HTML app shell must revalidate',
);
assert.equal(route('/*')?.statusCode, 404, 'unknown routes must produce HTTP 404');
assert.equal(config.responseOverrides?.['404']?.rewrite, '/404.html', 'HTTP 404 must render the designed page');
assert.ok(config.navigationFallback?.exclude?.includes('/*'), 'explicit routes must bypass the broad SPA fallback so unknown URLs remain 404');
assert.ok(routes.every((item) => !(item.rewrite && item.statusCode)), 'a route must not combine rewrite and statusCode');

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

for (const fragment of ['rel="canonical"', 'property="og:image"', 'name="twitter:card"', 'rel="apple-touch-icon"']) {
  assert.ok(html.includes(fragment), `app shell metadata must include ${fragment}`);
}
const notFound = readFileSync(join(dist, '404.html'), 'utf8');
assert.match(notFound, /<h1>This page does not exist<\/h1>/, 'designed 404 page must name the missing-page state');
assert.match(notFound, /href="\/"/, 'designed 404 page must link home');

const png = readFileSync(join(dist, 'apple-touch-icon.png'));
assert.equal(png.readUInt32BE(16), 180, 'Apple touch icon must be 180 px wide');
assert.equal(png.readUInt32BE(20), 180, 'Apple touch icon must be 180 px high');

function jpegSize(buffer) {
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) { offset += 1; continue; }
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    if (marker >= 0xc0 && marker <= 0xc3) return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
    offset += length + 2;
  }
  throw new Error('Social image has no JPEG size marker');
}
assert.deepEqual(jpegSize(readFileSync(join(dist, 'assets', 'skill-drill-social.jpg'))), { width: 1200, height: 630 }, 'social image must be 1200 × 630');

console.log(`Generated-artifact cache policy passed for ${generated.length} hashed JS/CSS file(s).`);
