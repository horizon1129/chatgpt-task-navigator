# ChatGPT Task Navigator

[简体中文](README.md) · [Changelog](CHANGELOG.md) · [Privacy](PRIVACY.md)

A small Chrome extension that adds an unobtrusive prompt navigator to ChatGPT. A thin rail sits at the right edge; hover to open the prompt list, preview a question, search, or jump back to it.

![UI illustration: collapsed rail and expanded prompt navigator](docs/assets/overview.svg)

Version **1.2.0** · Manifest V3 · No runtime dependencies · MIT License

## Features

- Right-edge rail with automatic hiding, light/dark themes and keyboard access.
- Searchable user-message index with original-text previews.
- Click to scroll to a prompt; attempts to remount off-screen messages.
- User-initiated history collection for virtualized, paginated conversations.
- Keeps collected prompts in page memory when the site unmounts rows.
- Distinct messages with identical text remain separate.
- No API key, model calls, telemetry, chat uploads or persistent chat storage.

The current interface is in Simplified Chinese.

## Install

This project is **not published in the Chrome Web Store**.

1. Download and extract the repository, or an extension ZIP from [Releases](https://github.com/horizon1129/chatgpt-task-navigator/releases).
2. Open `chrome://extensions/` and enable **Developer mode**.
3. Click **Load unpacked**.
4. For a repository download, select **`extension/`**. For a release ZIP, select the extracted directory containing `manifest.json` directly.
5. Reload a ChatGPT conversation in Chrome.

Keep the installed folder in place. No Node.js installation or local server is required for using the extension.

## Use

Hover over the thin line halfway down the **right edge** of the page. Move away to hide the panel, or use `›` / Esc. Search filters prompts; hover or focus a row for its original text.

If only a few prompts appear, select **收集历史提问** (Collect history). The extension scrolls through the transcript and waits for earlier pages to load. Let the scan finish; it attempts to restore your reading position. **停止收集** stops collection. Manual scrolling, clicking or typing in the page also stops it.

Collected prompts are kept only in memory. Reloading the page requires a new collection; switching chats clears the previous index.

## Limitations

- Targets ChatGPT in Chrome at `chatgpt.com` and `chat.openai.com`.
- Cannot be installed directly in the official ChatGPT or Codex desktop clients.
- Other Chromium browsers and mobile are not independently verified.
- ChatGPT DOM changes can break detection.
- Collection depends on history the page can load. It does not guarantee the full server-side history, and pauses after about three minutes so you can continue if needed.
- Off-screen navigation and restoration are best effort when layout or pagination changes.

## Development

Node.js 22+; no dependency installation is needed.

```sh
node --run check
node --run test
node --run pack
```

The generated ZIP in `dist/` contains only the extension runtime files and license. Node tests cover index state; real browser behavior still needs manual testing. See [CONTRIBUTING.md](CONTRIBUTING.md).

This is an independent project, not affiliated with or endorsed by OpenAI. Licensed under [MIT](LICENSE).
