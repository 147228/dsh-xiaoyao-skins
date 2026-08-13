# 贡献指南

欢迎提交完整皮肤、改进现有皮肤、修复兼容性问题或完善工具链。我们优先接受“真实
DSH profile 可安装、卸载干净、素材来源清楚”的贡献。

## 最短投稿路径

1. 先提交一条 [皮肤提案](https://github.com/147228/dsh-xiaoyao-skins/issues/new?template=skin_proposal.yml)，避免撞题；
2. 生成模板：`npx --yes github:147228/dsh-xiaoyao-skins create my-skin`；
3. 设计视觉并补全 `skin.json`、README、预览和素材来源；
4. 执行 `pnpm check` 与 `xiaoyao-skin doctor .`；
5. 在空白或脱敏的 DSH Web profile 中验证安装、切换、卸载；
6. 提交 Pull Request，并附暗色/亮色场景截图和验证记录。

## 合集内开发

```bash
git clone https://github.com/147228/dsh-xiaoyao-skins.git
cd dsh-xiaoyao-skins
corepack enable
pnpm install --frozen-lockfile
pnpm skin:new -- my-skin
pnpm check
```

合集内包名使用 `@xiaoyao-community/dsh-client-ui-skin-*`。维护者在合并时可能根据
授权与维护责任调整 scope；不要自行发布同名 npm 包。

## 强制验收项

- 使用官方 `dsh.bundle.patch` 与 `dsh.client.platform=web` 接线；
- Host 入口不接管功能服务，Client 只修改视觉表现；
- 所有选择器以该皮肤唯一的 `bodyAttr` 为边界；
- 使用 `ctx.effect()` 注册 DOM/CSS 生命周期，并在 dispose 后恢复；
- 不发起 `fetch`、WebSocket、XHR、Beacon 等网络请求；
- 不导入模型、会话、工具、沙箱等功能型 DSH 服务；
- 不包含本机路径、账号、聊天内容、未脱敏项目名或认证信息；
- 预览图应来自干净测试 profile，不展示真实会话、工作区或浏览器账号；
- 自有素材需明确许可；第三方素材需提供来源、作者、许可和再分发依据；
- 浅色卡片上的文字对比度、深色模式、缩放与窄屏都应可读。

详细字段和目录结构见 [皮肤规范](docs/SKIN_SPEC.md)，验收命令见
[测试说明](docs/TESTING.md)。

## 素材与 IP

贡献者必须拥有提交素材的权利，或能提供允许本仓库再分发的明确许可。不要提交：

- 来源不明的角色图、壁纸、字体或摄影作品；
- 含真实账号、会话、项目、客户或内部环境信息的截图；
- 仅允许个人使用、但不允许再分发的素材；
- 与当前皮肤无关的大体积源文件。

如使用夕小瑶 IP，请遵守仓库的 `ASSET_LICENSE.md`；商业使用请先联系维护者取得额外
授权。

## PR 范围

一个 PR 尽量只做一件事。新皮肤不要顺手重构其他皮肤；视觉修复不要修改安装器。
自动生成的 `catalog/skins.json`、`site/` 和 `lib/` 需要一并提交，CI 会检查是否漂移。
