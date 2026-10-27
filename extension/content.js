(() => {
  'use strict';
  const ID = 'local-chatgpt-task-navigator';
  if (document.getElementById(ID)) return;
  const host = document.createElement('div');
  host.id = ID;
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = `
    <style>
      :host { all:initial; --panel-width:min(280px,calc(100vw - 34px)); position:fixed; right:0; top:50%; transform:translateY(-50%); width:16px; height:min(46vh,360px); z-index:2147483000; font:13px/1.5 system-ui,"Microsoft YaHei",sans-serif; color:#e8edf5; color-scheme:dark; }
      * { box-sizing:border-box; }
      button,input { font:inherit; }
      button { cursor:pointer; }
      .rail { position:absolute; inset:0; width:16px; padding:0; border:0; background:transparent; color:inherit; }
      .rail::before { content:""; position:absolute; top:0; bottom:0; right:5px; width:2px; border-radius:9px; background:#8b98aa88; transition:background .15s,width .15s; }
      :host([data-open]) .rail::before,.rail:focus-visible::before { width:3px; background:#8197b9; }
      .rail:focus-visible { outline:1px solid #8197b9; outline-offset:-2px; border-radius:8px; }
      .panel { position:absolute; right:14px; top:50%; transform:translateY(-50%); display:flex; flex-direction:column; width:var(--panel-width); max-height:calc(100vh - 36px); border:1px solid #3b4351; border-radius:12px; background:#20242d; box-shadow:0 8px 28px #0003; }
      .panel::after { content:""; position:absolute; top:0; bottom:0; right:-15px; width:15px; }
      header { display:flex; align-items:center; padding:11px 12px; gap:8px; border-bottom:1px solid #374154; }
      strong { flex:1; font-size:13px; font-weight:600; }
      .count { color:#a6b5c9; font-size:12px; }
      .icon { border:0; background:transparent; color:inherit; padding:2px 7px; border-radius:5px; }
      .icon:hover { background:#344259; }
      .search { margin:9px 10px 4px; width:calc(100% - 20px); padding:7px 8px; border:1px solid #46536b; border-radius:7px; background:#171b22; color:inherit; outline-offset:2px; }
      .list { flex:1; min-height:0; max-height:min(50vh,440px); overflow:auto; padding:4px 7px 8px; scrollbar-width:thin; }
      .item { display:flex; width:100%; gap:9px; align-items:flex-start; text-align:left; padding:9px 7px; margin:3px 0; border:1px solid transparent; border-radius:8px; color:inherit; background:transparent; }
      .item:hover,.item:focus-visible { background:#2d3d56; }
      .item[aria-current="true"] { background:#2e394c; border-color:#526b8b; }
      .number { color:#9cbaef; font-size:11px; min-width:20px; padding-top:2px; }
      .label { display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:2; overflow:hidden; overflow-wrap:anywhere; }
      .empty { padding:18px 10px; color:#bac6d6; }
      .collect { display:block; width:calc(100% - 20px); margin:6px 10px; padding:7px; border:1px solid #597a9a; border-radius:7px; color:inherit; background:#35587922; }
      .status { padding:3px 12px 8px; color:#a5b2c4; font-size:11px; }
      footer { color:#a5b2c4; font-size:11px; padding:8px 12px; border-top:1px solid #374154; }
      .preview { position:absolute; right:calc(var(--panel-width) + 25px); top:50%; transform:translateY(-50%); width:320px; max-width:calc(100vw - var(--panel-width) - 42px); max-height:55vh; overflow:auto; white-space:pre-wrap; overflow-wrap:anywhere; padding:13px 15px; border:1px solid #3b4351; border-radius:10px; background:#20242d; color:#edf3fc; box-shadow:0 8px 28px #0003; pointer-events:none; }
      [hidden] { display:none !important; }
      @media(max-width:640px) { :host { --panel-width:min(248px,calc(100vw - 34px)); } .preview { display:none; } }
      @media(prefers-reduced-motion:reduce) { .rail::before { transition:none; } }
      @media(prefers-color-scheme:light) { :host { color:#252b35; color-scheme:light; } .panel,.preview { background:#fff; color:#252b35; border-color:#e0e3e8; box-shadow:0 8px 28px #1722351c; } .search { background:#f7f8fa; color:#252b35; border-color:#e2e5ea; } .item:hover,.item:focus-visible { background:#f1f3f6; } .item[aria-current="true"] { background:#edf2f8; border-color:#c7d3e5; } .number { color:#7c8797; } footer,.count,.empty,.status { color:#7b8492; } header,footer { border-color:#eceef1; } .icon:hover { background:#f1f3f6; } .collect { border-color:#e0e4ea; background:#f7f8fa; } }
    </style>
    <button class="rail" aria-label="展开提问导航" aria-expanded="false" aria-controls="task-nav-panel"></button>
    <section id="task-nav-panel" class="panel" hidden aria-label="当前对话提问导航">
      <header><strong title="版本 1.2.0">提问导航</strong><span class="count"></span><button class="icon refresh" title="重新扫描当前消息" aria-label="重新扫描提问">↻</button><button class="icon collapse" aria-label="收起提问导航">›</button></header>
      <input class="search" type="search" placeholder="搜索本次对话的提问…" aria-label="搜索提问">
      <button class="collect">收集历史提问</button>
      <div class="status" role="status">长对话可能只加载了部分消息，可收集历史。</div>
      <nav class="list" aria-label="提问列表"></nav>
      <footer>已收集提问会保留 · v1.2.0</footer>
    </section>
    <aside class="preview" hidden role="tooltip"></aside>`;
  document.documentElement.appendChild(host);
  const $ = s => shadow.querySelector(s);
  let records = [], signature = '', url = location.pathname, timer, active = -1;
  const messageIndex = new globalThis.ChatTaskMessageIndex();
  let previousKeys = [], previousTop = 0, collecting = false, stopRequested = false;
  let fallbackSequence = 0, lastVisibleCount = 0, navigationToken = 0, collectionDirection = 0;
  const fallbackIds = new WeakMap();
  const status = text => { $('.status').textContent = text; };
  const list = $('.list'), preview = $('.preview');
  const panel = $('.panel'), rail = $('.rail');
  let closeTimer;
  const openPanel = () => {
    clearTimeout(closeTimer);
    panel.hidden = false;
    host.setAttribute('data-open', '');
    rail.setAttribute('aria-expanded', 'true');
  };
  const closePanel = () => {
    clearTimeout(closeTimer);
    if (panel.contains(shadow.activeElement)) shadow.activeElement.blur();
    panel.hidden = true;
    host.removeAttribute('data-open');
    rail.setAttribute('aria-expanded', 'false');
    preview.hidden = true;
  };
  host.addEventListener('pointerenter', openPanel);
  host.addEventListener('pointerleave', () => { closeTimer = setTimeout(closePanel, 220); });
  rail.onfocus = openPanel;
  rail.onclick = openPanel;
  $('.collapse').onclick = closePanel;
  shadow.addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault(); rail.blur(); closePanel(); } });
  shadow.addEventListener('focusout', () => setTimeout(() => {
    if (!shadow.activeElement && !host.matches(':hover')) closePanel();
  }, 0));
  $('.refresh').onclick = () => scan(true);
  $('.search').oninput = render;
  $('.collect').onclick = () => collecting ? (stopRequested = true, status('正在停止，已收集的提问会保留。')) : collectHistory();

  function getScroller() {
    for (const el of document.querySelectorAll('[data-app-action-timeline-scroll], .thread-scroll-container')) {
      if (el.clientHeight > 60 && getComputedStyle(el).display !== 'none') return el;
    }
    const start = document.querySelector('[data-user-message-bubble], [data-message-author-role="user"]');
    for (let p = start?.parentElement; p; p = p.parentElement) {
      if (p.clientHeight > 60 && p.scrollHeight > p.clientHeight + 5 && /auto|scroll/.test(getComputedStyle(p).overflowY)) return p;
    }
    return document.scrollingElement || document.documentElement;
  }
  function metrics(scroller = getScroller()) {
    const page = scroller === document.scrollingElement || scroller === document.documentElement;
    return { top: scroller.scrollTop, height: scroller.scrollHeight, viewport: page ? innerHeight : scroller.clientHeight, origin: page ? 0 : scroller.getBoundingClientRect().top };
  }
  function moveScroller(scroller, top) { scroller.scrollTo({ top, behavior: 'instant' }); }
  function recordKey(canonical, text, top, duplicates) {
    const message = canonical.closest('[data-chatgpt-selection-message-id], [data-message-id]');
    const id = message?.getAttribute('data-chatgpt-selection-message-id') || message?.getAttribute('data-message-id');
    if (id) return `message:${id}`;
    const turn = canonical.closest('[data-turn-key], [data-turn-id], article[id], [data-testid^="conversation-turn-"]');
    const turnId = turn?.getAttribute('data-turn-key') || turn?.getAttribute('data-turn-id') || turn?.id || turn?.getAttribute('data-testid');
    if (turnId) {
      const base = `turn:${turnId}:${text}`;
      const ordinal = duplicates.get(base) || 0;
      duplicates.set(base, ordinal + 1);
      return `${base}:${ordinal}`;
    }
    if (!fallbackIds.has(canonical)) {
      const old = [...messageIndex.entries.values()].find(r => r.text === text && Math.abs(r.top - top) < 30 && !r.el?.isConnected);
      fallbackIds.set(canonical, old?.key || `node:${++fallbackSequence}`);
    }
    return fallbackIds.get(canonical);
  }

  function findMessages() {
    // ChatGPT can keep multiple main surfaces mounted. Do not assume the
    // first main contains the current thread, or require a layout box:
    // display:contents wrappers legitimately have no getClientRects().
    // Current ChatGPT's shared transcript renderer (698524.b544aec8f4.js)
    // marks bubbles with data-user-message-bubble, without legacy role attrs.
    const userSelector = '[data-user-message-bubble], [data-message-author-role="user"], [data-turn="user"], [data-testid="user-message"], .user-message-bubble-color';
    const elements = [...document.querySelectorAll(userSelector)];
    const turns = document.querySelectorAll('article, [data-testid^="conversation-turn-"], [data-turn-id], [data-chatgpt-selection-message-id]');
    for (const turn of turns) {
      // Semantic role headings are a fallback when message data attributes
      // are absent. Ignore headings inside a reply's Markdown content.
      const heading = turn.querySelector('h4.sr-only, h5, h6, .sr-only');
      if (!heading || heading.closest('.markdown')) continue;
      if (/^(你说|您说|你說|您說|You said)\s*[:：]?$/i.test(heading.textContent.trim())) elements.push(turn);
    }
    const seen = new Set();
    const messages = [];
    for (const candidate of elements) {
      if (host.contains(candidate) || candidate.closest('[hidden], [inert], [aria-hidden="true"]')) continue;
      const turn = candidate.closest('article, [data-testid^="conversation-turn-"], [data-turn-id], [data-chatgpt-selection-message-id]') || candidate;
      const canonical = (turn.matches(userSelector) ? turn : turn.querySelector(userSelector)) || turn;
      if (seen.has(canonical)) continue;
      // A real display:none ancestor is hidden; a zero-sized message wrapper
      // or an off-screen content-visibility placeholder is not.
      let hidden = false;
      for (let p = canonical; p && p !== document.body; p = p.parentElement) {
        if (getComputedStyle(p).display === 'none') { hidden = true; break; }
      }
      if (hidden) continue;
      seen.add(canonical);
      const textEl = canonical.querySelector('[data-user-message-bubble], [data-message-author-role="user"], [data-testid="user-message"], .whitespace-pre-wrap, .user-message-bubble-color') || canonical;
      let text = (textEl.innerText || textEl.textContent || '').trim();
      if (textEl === turn) {
        const clone = turn.cloneNode(true);
        for (const extra of clone.querySelectorAll('h4.sr-only, h5, h6, .sr-only, button, [role="group"]')) extra.remove();
        text = clone.textContent.trim();
      }
      messages.push({ el: canonical, text: text || '图片或附件提问' });
    }
    messages.sort((a, b) => a.el === b.el ? 0 : a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
    const m = metrics(), duplicates = new Map();
    return messages.map((r, index) => {
      // Scroll to a descendant when the wrapper uses display:contents.
      const target = r.el.getClientRects().length ? r.el : r.el.querySelector('.whitespace-pre-wrap, .user-message-bubble-color, div, p, span') || r.el.parentElement;
      const top = target.getBoundingClientRect().top - m.origin + m.top;
      return { ...r, key: recordKey(r.el, r.text, top, duplicates), el: target, top, index };
    });
  }
  function render() {
    const query = $('.search').value.trim().toLocaleLowerCase();
    list.replaceChildren();
    $('.count').textContent = `${records.length} 条`;
    preview.hidden = true;
    const filtered = records.filter(r => r.text.toLocaleLowerCase().includes(query));
    if (!filtered.length) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.textContent = query ? '没有匹配的提问。' : '未发现提问。请打开已有聊天；若已有消息，可点击 ↻ 重新扫描。';
      list.append(empty);
    }
    for (const r of filtered) {
      const button = document.createElement('button');
      button.className = 'item';
      button.dataset.index = r.index;
      button.setAttribute('aria-label', `第 ${r.index + 1} 条：${r.text.slice(0, 160)}`);
      const number = document.createElement('span');
      number.className = 'number'; number.textContent = r.index + 1;
      const label = document.createElement('span');
      label.className = 'label'; label.textContent = r.text;
      button.append(number, label);
      const show = () => { preview.textContent = r.text; preview.hidden = false; };
      button.onmouseenter = show; button.onfocus = show;
      button.onmouseleave = button.onblur = () => { preview.hidden = true; };
      button.onclick = () => navigateTo(r);
      list.append(button);
    }
    highlight();
  }
  function highlight() {
    for (const b of list.querySelectorAll('.item')) b.setAttribute('aria-current', String(Number(b.dataset.index) === active));
  }
  function scan(force = false) {
    const changedUrl = url !== location.pathname;
    if (changedUrl) {
      stopRequested = true; navigationToken++;
      url = location.pathname; messageIndex.clear(); previousKeys = []; signature = '';
      $('.search').value = ''; active = -1;
      status('已切换对话，可重新收集此聊天的历史提问。');
    }
    const next = findMessages();
    const currentTop = metrics().top;
    // Prepending an older page can increase scrollTop to preserve the viewport.
    // During collection, use the traversal direction instead of that offset.
    const direction = collectionDirection || (currentTop < previousTop - 5 ? -1 : 1);
    records = messageIndex.merge(next, { previousKeys, direction });
    lastVisibleCount = next.length;
    if (next.length) previousKeys = next.map(r => r.key);
    previousTop = currentTop;
    const nextSignature = JSON.stringify(records.map(r => [r.key, r.text]));
    if (force || changedUrl || nextSignature !== signature) {
      signature = nextSignature; render();
    }
  }
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  async function navigateTo(record, { restore = false } = {}) {
    if (collecting && !restore) { stopRequested = true; status('请等历史收集停止后再点击跳转。'); return; }
    const path = location.pathname, token = ++navigationToken, scroller = getScroller();
    preview.hidden = true;
    const targetRecord = () => findMessages().find(r => r.key === record.key);
    let live = targetRecord();
    if (!live) {
      if (!restore) status('正在重新加载目标消息…');
      const base = messageIndex.entries.get(record.key)?.top ?? record.top;
      const viewport = metrics(scroller).viewport;
      for (const offset of [0, -0.6, 0.6, -1.4, 1.4]) {
        if (location.pathname !== path || navigationToken !== token) return;
        moveScroller(scroller, Math.max(0, base - viewport * 0.35 + viewport * offset));
        await delay(300); scan(); live = targetRecord();
        if (live) break;
      }
    }
    if (location.pathname !== path || navigationToken !== token) return;
    if (live?.el?.isConnected) {
      live.el.scrollIntoView({ behavior: restore || matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' });
      if (!restore && live.el.animate) live.el.animate([{ outline: '3px solid #47b89a', outlineOffset: '6px' }, { outline: '3px solid transparent', outlineOffset: '6px' }], { duration: 1500 });
      active = records.findIndex(r => r.key === record.key); highlight();
      if (!restore) status(`已定位第 ${active + 1} 条提问。`);
    } else if (!restore) status('页面未重新加载目标消息，请收集历史后再试。');
  }
  function advanceTarget(scroller) {
    const m = metrics(scroller);
    // Skip through rows already indexed, including very long assistant replies.
    // Never jump across a gap containing unmounted rows.
    const intervals = [...scroller.querySelectorAll('[data-turn-key]')].map(el => {
      const rect = el.getBoundingClientRect();
      return { top: rect.top - m.origin + m.top, bottom: rect.bottom - m.origin + m.top };
    }).filter(r => r.bottom >= m.top && r.bottom > r.top).sort((a, b) => a.top - b.top);
    let edge = m.top + m.viewport;
    for (const row of intervals) {
      if (row.top > edge + 80) break;
      edge = Math.max(edge, row.bottom);
    }
    return Math.min(m.height - m.viewport, Math.max(m.top + Math.max(150, m.viewport * 0.75), edge - m.viewport * 0.3));
  }
  async function collectHistory() {
    if (collecting) return;
    scan();
    const path = location.pathname, scroller = getScroller(), original = metrics(scroller);
    const initial = findMessages().filter(r => r.top >= original.top - 50).sort((a,b) => a.top-b.top)[0];
    const originalGap = initial ? initial.top - original.top : null;
    let steps = 0, limited = false;
    collecting = true; stopRequested = false; $('.collect').textContent = '停止收集';
    const cancelOnInput = event => {
      if (event.isTrusted && !host.contains(event.target) && !event.composedPath().includes(host)) stopRequested = true;
    };
    for (const type of ['wheel', 'touchstart', 'pointerdown', 'keydown']) document.addEventListener(type, cancelOnInput, { capture: true, passive: true });
    const alive = () => !stopRequested && location.pathname === path;
    const started = Date.now();
    try {
      // A second sweep catches older pages which arrived during the first.
      for (let pass = 0; pass < 3 && alive(); pass++) {
        const countBefore = messageIndex.entries.size;
        collectionDirection = -1;
        status(`正在加载更早消息，已收集 ${countBefore} 条…`);
        let stable = 0, lastTopSignature = '';
        for (let i = 0; i < 60 && alive(); i++) {
          moveScroller(scroller, 0); await delay(750); scan();
          const m = metrics(scroller);
          const state = `${Math.round(m.height)}:${findMessages().map(r => r.key).join('|')}`;
          stable = m.top < 5 && state === lastTopSignature ? stable + 1 : 0;
          lastTopSignature = state;
          status(`正在加载更早消息，已收集 ${records.length} 条…`);
          if (stable >= 4) break;
          if (Date.now() - started > 180000) { limited = true; break; }
        }
        collectionDirection = 1;
        let bottomStable = 0, lastBottom = '';
        while (alive() && !limited) {
          scan();
          const m = metrics(scroller);
          status(`正在遍历历史：已收集 ${records.length} 条（当前加载 ${lastVisibleCount} 条）…`);
          const atBottom = m.height - m.viewport - m.top < 8;
          if (atBottom) {
            const state = `${Math.round(m.height)}:${records.length}`;
            bottomStable = state === lastBottom ? bottomStable + 1 : 0;
            lastBottom = state;
            if (bottomStable >= 2) break;
            await delay(500);
          } else {
            bottomStable = 0;
            const target = advanceTarget(scroller);
            if (target <= m.top + 1) { limited = true; break; }
            moveScroller(scroller, target);
            await delay(220);
          }
          if (++steps >= 1500 || Date.now() - started > 180000) { limited = true; break; }
        }
        if (pass > 0 && messageIndex.entries.size === countBefore || limited) break;
      }
    } catch (error) {
      console.warn('Task navigator history collection stopped:', error);
      limited = true;
    } finally {
      for (const type of ['wheel', 'touchstart', 'pointerdown', 'keydown']) document.removeEventListener(type, cancelOnInput, true);
      const interrupted = !alive();
      collecting = false; collectionDirection = 0; $('.collect').textContent = '收集历史提问';
      if (location.pathname === path) {
        if (!interrupted) {
          // Preserve the user's original reading position after loading history.
          if (initial && messageIndex.entries.has(initial.key)) {
            await navigateTo(messageIndex.entries.get(initial.key), { restore: true });
            const live = findMessages().find(r => r.key === initial.key);
            if (live) moveScroller(scroller, live.top - originalGap);
          } else {
            const m = metrics(scroller);
            moveScroller(scroller, Math.max(0, m.height - (original.height - original.top)));
          }
        }
        scan(true);
        status(interrupted ? `已停止，保留 ${records.length} 条提问。` : limited ? `已收集 ${records.length} 条；尚未遍历完，可再次收集。` : `已遍历当前可加载历史，共收集 ${records.length} 条。`);
      }
    }
  }
  let scrollPending = false;
  document.addEventListener('scroll', () => {
    if (scrollPending) return;
    scrollPending = true;
    requestAnimationFrame(() => {
      scrollPending = false;
      let nearest = -1, distance = Infinity;
      for (const r of records) {
        if (!r.el?.isConnected) continue;
        const rect = r.el.getBoundingClientRect();
        const d = Math.abs(rect.top - innerHeight * 0.3);
        if (d < distance) { distance = d; nearest = r.index; }
      }
      if (active !== nearest) { active = nearest; highlight(); }
    });
  }, { capture: true, passive: true });
  new MutationObserver(mutations => {
    if (!mutations.some(m => m.target !== host && !host.contains(m.target))) return;
    clearTimeout(timer); timer = setTimeout(scan, 250);
  }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['data-user-message-bubble', 'data-message-author-role', 'data-turn', 'data-testid', 'hidden', 'aria-hidden'] });
  setInterval(() => { if (url !== location.pathname) scan(true); }, 1000);
  scan(true);
})();
