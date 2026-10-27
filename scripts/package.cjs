// A dependency-free ZIP writer. Only explicit runtime files are packaged.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'extension/manifest.json'), 'utf8'));
const entries = ['manifest.json', 'index-core.js', 'content.js'].map(name => ({
  name, data: fs.readFileSync(path.join(root, 'extension', name)),
}));
entries.push({ name: 'LICENSE', data: fs.readFileSync(path.join(root, 'LICENSE')) });
const table = Array.from({ length: 256 }, (_, value) => {
  for (let i = 0; i < 8; i++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const value of bytes) crc = table[(crc ^ value) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
const chunks = [], directory = [];
let offset = 0;
for (const { name, data } of entries) {
  const filename = Buffer.from(name, 'utf8'), checksum = crc32(data);
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4);
  local.writeUInt16LE(0x800, 6); local.writeUInt16LE(0x21, 12);
  local.writeUInt32LE(checksum, 14); local.writeUInt32LE(data.length, 18);
  local.writeUInt32LE(data.length, 22); local.writeUInt16LE(filename.length, 26);
  chunks.push(local, filename, data);
  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(20, 4);
  central.writeUInt16LE(20, 6); central.writeUInt16LE(0x800, 8);
  central.writeUInt16LE(0x21, 14); central.writeUInt32LE(checksum, 16);
  central.writeUInt32LE(data.length, 20); central.writeUInt32LE(data.length, 24);
  central.writeUInt16LE(filename.length, 28); central.writeUInt32LE(offset, 42);
  directory.push(central, filename);
  offset += local.length + filename.length + data.length;
}
const centralData = Buffer.concat(directory), end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8);
end.writeUInt16LE(entries.length, 10); end.writeUInt32LE(centralData.length, 12);
end.writeUInt32LE(offset, 16);
const output = path.join(root, 'dist', `chatgpt-task-navigator-v${manifest.version}.zip`);
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, Buffer.concat([...chunks, centralData, end]));
console.log(`Packaged ${entries.length} files: ${path.relative(root, output)}`);
