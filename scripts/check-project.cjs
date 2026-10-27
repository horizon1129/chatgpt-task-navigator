const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const extension = path.join(root, 'extension');
const manifest = JSON.parse(fs.readFileSync(path.join(extension, 'manifest.json'), 'utf8'));
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
assert.equal(manifest.manifest_version, 3);
assert.equal(manifest.version, pkg.version, 'Package and extension versions must match');
assert.deepEqual(manifest.content_scripts[0].matches, ['https://chatgpt.com/*', 'https://chat.openai.com/*']);
for (const script of manifest.content_scripts.flatMap(entry => entry.js)) {
  const file = path.resolve(extension, script);
  assert.ok(file.startsWith(extension + path.sep), 'Script must stay inside extension/');
  assert.ok(fs.statSync(file).isFile(), `Missing script: ${script}`);
}
const content = fs.readFileSync(path.join(extension, 'content.js'), 'utf8');
assert.ok(content.includes(`v${manifest.version}`), 'UI version must match the manifest');
for (const file of ['README.md', 'LICENSE', 'CHANGELOG.md', 'PRIVACY.md']) {
  assert.ok(fs.statSync(path.join(root, file)).isFile(), `Missing project document: ${file}`);
}
console.log(`Project checks passed: v${manifest.version}`);
