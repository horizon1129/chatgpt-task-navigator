# 隐私说明 / Privacy

## 页面访问

扩展通过 Manifest V3 内容脚本在 `https://chatgpt.com/*` 和 `https://chat.openai.com/*` 上运行。它从匹配页面的 DOM 读取用户消息文本、消息标识和滚动位置，以生成提问目录。

## 数据处理

- 提问文本、消息标识与定位信息仅保存在当前网页的 JavaScript 内存中。
- 刷新网页、关闭标签页会丢弃目录；切换聊天会清空旧目录。
- 收起导航不会清空当前目录。
- 不写入 Chrome storage、localStorage、数据库或文件。
- 不读取登录 Cookie、访问令牌、密码或其他账户凭据。
- 没有分析、广告或遥测服务。
- 扩展代码不发起 fetch、XHR、WebSocket 或其他外部请求。

“收集历史提问”通过滚动触发 **ChatGPT 网页自身** 正常加载历史。ChatGPT 自己的网络请求仍按其服务规则运行；本扩展不会将消息发送到另一个服务器。

## 权限

当前 manifest 没有额外声明 `permissions` 或 `host_permissions`。内容脚本的匹配站点仍意味着扩展可以读取并修改这些页面；请在安装前检查源码。

## 分享问题报告

不要把真实聊天、登录信息、账户标识或密钥附在公开 Issue、截图或 PR 中。请使用虚构消息和最小复现。项目文档中的界面图是示意图，不包含真实聊天。

## English summary

The extension reads user-message DOM elements and scroll positions on its two declared ChatGPT origins. The prompt index stays in page memory and is cleared on reload or chat changes. No chat data is persisted, uploaded, tracked or sent to an external service. It does not read cookies or credentials. History collection scrolls the normal page, which may cause ChatGPT itself to load earlier messages. Content-script access still grants the ability to read and modify matching pages even without an additional permissions list.
