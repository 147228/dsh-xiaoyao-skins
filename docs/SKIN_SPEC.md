# DSH 皮肤规范 v1

## 必需目录

```text
my-skin/
├── package.json
├── skin.json
├── cordis.patch.yml
├── src/index.ts
├── src/client/index.ts
├── src/client/*.module.css
├── tests/apply.spec.ts
├── preview/dark.(png|jpg|webp|svg)
├── README.md
├── LICENSE
├── ASSET_LICENSE.md
└── THIRD_PARTY_NOTICES.md
```

## `skin.json`

每个皮肤必须声明唯一的 `id`、包名、`bodyAttr`、接线 id、作者、描述、色彩、标签、
预览和显示顺序。`wiring.bundleWired` 必须为 `true`，代表它能通过一条 DSH 插件命令
自动接入 Web profile。

```json
{
  "id": "xiaoyao-moon-rabbit",
  "name": "月兔研究所",
  "nameEn": "Moon Rabbit Lab",
  "author": "Your Name",
  "tagline": "月白 × 靛蓝 × 柔光",
  "description": "一句说明它改变了什么视觉体验。",
  "accent": "#7c83ff",
  "bodyAttr": "data-dsh-moon-rabbit",
  "package": "@xiaoyao-community/dsh-client-ui-skin-moon-rabbit",
  "version": "0.1.0",
  "tags": ["moon", "light", "community"],
  "preview": { "dark": "preview/dark.webp" },
  "wiring": { "id": "ui-skin-moon-rabbit", "bundleWired": true }
}
```

## DSH manifest

`package.json` 必须同时公开 Host 和 Client 构建产物：

```json
{
  "main": "lib/index.js",
  "exports": { "./client": "./lib/client.js" },
  "dsh": {
    "bundle": { "patch": "./cordis.patch.yml" },
    "client": { "platform": "web" }
  }
}
```

`cordis.patch.yml` 的插件名必须等于包名，接线 id 必须等于 `skin.json` 的
`wiring.id`。

## CSS 隔离与可读性

- 全部规则必须以 `body[你的-bodyAttr]` 为作用域；
- 浅色表面使用深色文字，深色表面使用浅色文字；
- 背景图上方的主界面保留足够不透明度，不能牺牲按钮、表单和代码块可读性；
- 为 `prefers-reduced-motion: reduce` 提供降级；
- 避免依赖浏览器实验特性；使用 `backdrop-filter` 时必须有无滤镜回退；
- 在 100%、125%、150% 缩放以及常见窄屏下检查溢出。

## 素材预算

- 预览图不超过 5 MB；
- 单套源码素材建议不超过 20 MB；
- 提交用于运行期的优化版，不要直接嵌入数十 MB 的生图原稿；
- 图片必须可在离线环境工作，禁止运行时远程拉取。

## 安全与隐私

皮肤包不得包含网络请求、遥测、外部脚本、本机绝对路径、账号信息、真实会话或未脱敏
工作区截图。自动校验只能兜底，贡献者仍需对素材和代码负责。
