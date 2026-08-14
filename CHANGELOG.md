# Changelog

## 0.1.3 - 2026-08-14

- 修复 `dsh plugin` 因系统未安装全局 pnpm 而退出的问题：安装器会优先使用现有 pnpm，
  否则通过 Corepack 或 npx 临时提供与当前 Node.js 兼容的版本，不修改全局配置；
- 增加 Node.js、DSH、pnpm 的安装前检查和中文故障提示；
- 安装器兼容 Node.js 20 / 22 / 24，完整开发与构建仍以 Node.js 24 为准。

## 0.1.2 - 2026-08-14

- 展厅六张预览更新为飞书文档中的真实 DSH Web profile 截图；
- 补齐 `zhu1090093659/dsh-web-ui` 衍生构建支持的 BSD-3-Clause 版权声明。

## 0.1.1 - 2026-08-14

- 修复 npm/npx 安装后通过软链接调用 CLI 会静默退出的问题；
- 一行命令改用 14 KB Release 工具包，不再拉取完整素材仓库。

## 0.1.0 - 2026-08-14

- 首发六套真实 DeepSeek Harness Web profile 皮肤；
- 提供 `list`、`use`、`current`、`official`、`create`、`doctor` 与 `submit` 命令；
- 提供创作者模板、结构与权限校验、生命周期测试；
- 提供 GitHub Pages 展厅、三平台 CI 与可校验 Release 资产。
