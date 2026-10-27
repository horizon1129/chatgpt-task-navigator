(() => {
  'use strict';
  // Keep a chronological index even when the transcript unmounts old rows.
  class MessageIndex {
    constructor() { this.entries = new Map(); this.order = []; }
    merge(incoming, { previousKeys = [], direction = 0 } = {}) {
      // Retain text and positions, not detached transcript DOM trees.
      for (const entry of this.entries.values()) {
        if (entry.el && !entry.el.isConnected) entry.el = null;
      }
      incoming.forEach((record, i) => {
        if (!this.entries.has(record.key)) {
          let before = incoming.slice(i + 1).find(r => this.entries.has(r.key))?.key;
          let after = incoming.slice(0, i).reverse().find(r => this.entries.has(r.key))?.key;
          if (!before && !after) {
            const anchors = previousKeys.filter(k => this.entries.has(k));
            if (direction < 0) before = anchors[0];
            else after = anchors.at(-1);
          }
          let position;
          if (before) position = this.order.indexOf(before);
          else if (after) position = this.order.indexOf(after) + 1;
          else {
            position = this.order.findIndex(k => (this.entries.get(k).top ?? Infinity) > record.top);
            if (position < 0) position = this.order.length;
          }
          this.order.splice(position, 0, record.key);
        }
        this.entries.set(record.key, { ...this.entries.get(record.key), ...record });
      });
      return this.values();
    }
    values() { return this.order.map((key, index) => ({ ...this.entries.get(key), index })); }
    clear() { this.entries.clear(); this.order = []; }
  }
  if (typeof module === 'object' && module.exports) module.exports = MessageIndex;
  else globalThis.ChatTaskMessageIndex = MessageIndex;
})();
