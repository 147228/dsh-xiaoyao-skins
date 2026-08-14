# 测试与验收

## 创作者本地检查

```bash
corepack enable
pnpm install
pnpm check
npx --yes --package=https://github.com/147228/dsh-xiaoyao-skins/releases/latest/download/xiaoyao-skin-kit.tgz xiaoyao-skin doctor .
```

`doctor` 检查目录、元数据、官方 DSH 接线、CSS 作用域、生命周期、网络请求、功能服务
导入、本机路径和素材大小。`pnpm check` 还会执行 TypeScript、单测与构建。

## 真实 profile 冒烟测试

建议用独立目录，不要直接拿日常 profile 截图或试验：

```bash
export DSH_HOME="$(mktemp -d)"
dsh --profile web init
dsh plugin --profile web add link:$(pwd)
dsh --profile web
```

验收至少覆盖：

1. 冷启动后能加载皮肤 client bundle；
2. 新会话、项目、模型、工具、沙箱等原功能仍可访问；
3. 浅色/深色区域文字清晰，弹窗、下拉、输入框和代码块可读；
4. 切换另一套皮肤后旧 `bodyAttr` 与运行期 style 不残留；
5. `use official` 后恢复原界面，非皮肤依赖清单与测试前一致。

## CI

安装器单测会在 Node.js 20、22、24 上执行；完整检查会在 Ubuntu、macOS、Windows 的
Node.js 24 环境执行，并
验证生成目录无漂移。`v*` 标签只有在完整检查通过后才会生成六个皮肤 tarball、工具包、
目录文件和 SHA-256 校验值。
