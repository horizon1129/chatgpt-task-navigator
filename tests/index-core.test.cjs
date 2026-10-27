const assert = require('node:assert/strict');
const { test } = require('node:test');
const MessageIndex = require('../extension/index-core.js');
const row = n => ({ key: `message:${n}`, text: n % 2 ? '继续' : `提问 ${n}`, top: n * 100 });
const rows = values => values.map(row);
const keys = values => values.map(n => row(n).key);

test('unmounted messages remain indexed and identical prompts stay distinct', () => {
  const index = new MessageIndex();
  index.merge(rows([6, 7, 8, 9, 10]));
  index.merge(rows([1, 2, 3, 4, 5]), { previousKeys: keys([6, 7, 8, 9, 10]), direction: -1 });
  assert.deepEqual(index.values().map(r => r.key), keys([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));
  index.merge(rows([8, 9, 10]));
  assert.equal(index.values().length, 10);
  assert.equal(index.values().filter(r => r.text === '继续').length, 5);
});

test('disjoint forward windows insert between known older and newer rows', () => {
  const index = new MessageIndex();
  index.merge(rows([16, 17, 18, 19, 20]));
  index.merge(rows([1, 2, 3, 4, 5]), { previousKeys: keys([16, 17, 18, 19, 20]), direction: -1 });
  index.merge(rows([6, 7, 8, 9, 10]), { previousKeys: keys([1, 2, 3, 4, 5]), direction: 1 });
  index.merge(rows([11, 12, 13, 14, 15]), { previousKeys: keys([6, 7, 8, 9, 10]), direction: 1 });
  assert.deepEqual(index.values().map(r => r.key), keys(Array.from({ length: 20 }, (_, i) => i + 1)));
});

test('older-page loading and a forward sweep preserve all thirty prompts in order', () => {
  const index = new MessageIndex();
  index.merge(rows([26, 27, 28, 29, 30]));
  index.merge(rows([21, 22, 23, 24, 25]), { previousKeys: keys([26, 27, 28, 29, 30]), direction: -1 });
  index.merge(rows([19, 20, 21, 22, 23]), { previousKeys: keys([21, 22, 23, 24, 25]), direction: -1 });
  index.merge(rows([1, 2, 3, 4, 5]), { previousKeys: keys([19, 20, 21, 22, 23]), direction: -1 });
  for (let start = 6; start <= 26; start += 5) {
    const window = Array.from({ length: 5 }, (_, i) => start + i);
    index.merge(rows(window), { previousKeys: keys(window.map(n => n - 5)), direction: 1 });
  }
  assert.deepEqual(index.values().map(r => r.key), keys(Array.from({ length: 30 }, (_, i) => i + 1)));
  index.merge([row(31)], { previousKeys: keys([26, 27, 28, 29, 30]), direction: 1 });
  assert.equal(index.values().at(-1).key, 'message:31');
});

test('edits update the same message and resetting a chat clears the previous index', () => {
  const index = new MessageIndex();
  index.merge([row(1), row(2)]);
  index.merge([{ ...row(1), text: '编辑后的提问' }]);
  assert.equal(index.values().length, 2);
  assert.equal(index.values()[0].text, '编辑后的提问');
  index.clear();
  index.merge([row(99)]);
  assert.deepEqual(index.values().map(r => r.key), ['message:99']);
});

test('detached transcript nodes are released while their prompt text remains', () => {
  const index = new MessageIndex();
  const element = { isConnected: true };
  index.merge([{ ...row(1), el: element }]);
  element.isConnected = false;
  index.merge([row(2)]);
  assert.equal(index.values()[0].el, null);
  assert.equal(index.values()[0].text, '继续');
  assert.equal(index.values().length, 2);
});
