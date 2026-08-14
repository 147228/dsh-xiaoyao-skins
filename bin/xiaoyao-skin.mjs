#!/usr/bin/env node
import { chmodSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { basename, delimiter, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const kitRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const catalogPath = join(kitRoot, 'catalog', 'skins.json')
const namePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const minimumNodeMajor = 20
const pnpm10 = '10.34.5'
const pnpm11 = '11.19.0'

export function nodeMajor(version = process.versions.node) {
  const match = String(version).match(/^v?(\d+)/)
  return match ? Number(match[1]) : Number.NaN
}

export function assertSupportedNode(version = process.versions.node) {
  const major = nodeMajor(version)
  if (Number.isFinite(major) && major >= minimumNodeMajor) return
  throw new Error([
    `切换皮肤需要 Node.js ${minimumNodeMajor} 或更高版本，当前为 ${version}。`,
    '下载：https://nodejs.org/en/download',
    '推荐使用 Node.js 24 LTS；升级后重新运行同一条命令即可。',
  ].join('\n'))
}

export function compatiblePnpmVersion(version = process.versions.node) {
  const [major = 0, minor = 0] = String(version).replace(/^v/, '').split('.').map(Number)
  return major > 22 || (major === 22 && minor >= 13) ? pnpm11 : pnpm10
}

function commandResult(spawn, command, args, env, platform, cwd) {
  return spawn(command, args, {
    env,
    cwd,
    encoding: 'utf8',
    stdio: 'pipe',
    shell: platform === 'win32',
  })
}

function commandWorks(result) {
  return !result.error && result.status === 0
}

function resultDetail(result) {
  const detail = String(result.stderr || result.stdout || result.error?.message || '').trim()
  return detail ? `\n${detail.slice(0, 600)}` : ''
}

function pathKey(env, platform) {
  if (platform !== 'win32') return 'PATH'
  return Object.keys(env).find((key) => key.toLowerCase() === 'path') ?? 'Path'
}

function writePnpmProxy(directory, platform, runner, version) {
  if (platform === 'win32') {
    const command = runner === 'corepack'
      ? `@echo off\r\ncorepack pnpm@${version} %*\r\n`
      : `@echo off\r\nnpx --yes pnpm@${version} %*\r\n`
    writeFileSync(join(directory, 'pnpm.cmd'), command)
    return
  }
  const command = runner === 'corepack'
    ? `#!/bin/sh\nexec corepack pnpm@${version} "$@"\n`
    : `#!/bin/sh\nexec npx --yes pnpm@${version} "$@"\n`
  const path = join(directory, 'pnpm')
  writeFileSync(path, command)
  chmodSync(path, 0o755)
}

/** Prepare the package-manager environment expected by `dsh plugin`.
 *
 * DSH currently invokes `pnpm` by name. If it is absent or incompatible with
 * the active Node.js version, expose a temporary, version-pinned proxy backed
 * by Corepack (preferred) or npx. No global package or shim is installed.
 */
export function preparePluginManagerEnvironment(options = {}) {
  const env = { ...(options.env ?? process.env) }
  const spawn = options.spawn ?? spawnSync
  const platform = options.platform ?? process.platform
  const makeTempDir = options.makeTempDir ?? (() => mkdtempSync(join(tmpdir(), 'xiaoyao-skin-corepack-')))
  const removeTempDir = options.removeTempDir ?? ((path) => rmSync(path, { recursive: true, force: true }))
  const pathDelimiter = options.pathDelimiter ?? delimiter
  const version = options.pnpmVersion ?? compatiblePnpmVersion(options.nodeVersion)
  const writeProxy = options.writeProxy ?? writePnpmProxy
  const cwd = options.cwd

  const direct = commandResult(spawn, 'pnpm', ['--version'], env, platform, cwd)
  if (commandWorks(direct)) return { env, source: 'pnpm', version: String(direct.stdout).trim(), cleanup() {} }

  const corepack = commandResult(spawn, 'corepack', ['--version'], env, platform, cwd)
  const npx = commandWorks(corepack)
    ? null
    : commandResult(spawn, 'npx', ['--version'], env, platform, cwd)
  const runner = commandWorks(corepack) ? 'corepack' : commandWorks(npx) ? 'npx' : null
  if (!runner) {
    throw new Error([
      'DSH 管理 profile 插件需要 pnpm，但当前没有可用的 pnpm、Corepack 或 npx。',
      '请安装 Node.js 24 LTS（自带 npm），然后重新运行同一条命令。',
      `pnpm 检测结果：${resultDetail(direct).trim() || '命令不存在'}`,
    ].join('\n'))
  }

  const shimDir = makeTempDir()
  try {
    writeProxy(shimDir, platform, runner, version)
    const key = pathKey(env, platform)
    const runtimeEnv = { ...env, [key]: [shimDir, env[key]].filter(Boolean).join(pathDelimiter) }
    runtimeEnv.COREPACK_ENABLE_DOWNLOAD_PROMPT = '0'
    const verified = commandResult(spawn, 'pnpm', ['--version'], runtimeEnv, platform, cwd)
    if (!commandWorks(verified)) {
      throw new Error([
        `无法为本次操作启动兼容的 pnpm ${version}。`,
        resultDetail(verified).trim() || '未知错误',
        `可手动安装后重试：npm install -g pnpm@${version}`,
      ].join('\n'))
    }
    return {
      env: runtimeEnv,
      source: runner,
      version,
      cleanup: () => removeTempDir(shimDir),
    }
  } catch (error) {
    removeTempDir(shimDir)
    throw error
  }
}

export function assertDshAvailable(dsh = 'dsh', options = {}) {
  const env = options.env ?? process.env
  const spawn = options.spawn ?? spawnSync
  const result = commandResult(spawn, dsh, ['--version'], env, options.platform ?? process.platform, options.cwd)
  if (commandWorks(result)) return
  throw new Error([
    `找不到可用的 DeepSeek Harness 命令：${dsh}`,
    '请先安装并初始化官方 DSH：npm install -g @deepseek-ai/dsh',
    resultDetail(result).trim(),
  ].filter(Boolean).join('\n'))
}

export function loadCatalog(path = catalogPath) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

export function isMainModule(argvPath, modulePath = fileURLToPath(import.meta.url), canonicalize = realpathSync) {
  if (!argvPath) return false
  try {
    return canonicalize(argvPath) === canonicalize(modulePath)
  } catch {
    return false
  }
}

export function useLocalReleaseDirectory(catalog, directory) {
  if (!directory) return catalog
  const localDirectory = resolve(directory)
  return {
    ...catalog,
    skins: catalog.skins.map((skin) => ({
      ...skin,
      source: join(localDirectory, skin.releaseAsset),
    })),
  }
}

export function readProfileManifest(dshHome, profile) {
  const path = join(dshHome, 'profiles', profile, 'package.json')
  if (!existsSync(path)) return { path, manifest: { dependencies: {}, dsh: { profile: { bundles: [] } } } }
  return { path, manifest: JSON.parse(readFileSync(path, 'utf8')) }
}

export function planSwitch(manifest, catalog, targetSlug) {
  const known = new Map(catalog.skins.map((skin) => [skin.package, skin]))
  const dependencyNames = Object.keys(manifest.dependencies ?? {})
  const bundleNames = manifest.dsh?.profile?.bundles ?? []
  const installed = [...new Set([...dependencyNames, ...bundleNames])].filter((name) => known.has(name))
  if (targetSlug === 'official') {
    return { target: null, add: null, removals: installed.sort() }
  }
  const target = catalog.skins.find((skin) => skin.slug === targetSlug)
  if (!target) throw new Error(`unknown skin "${targetSlug}"`)
  return {
    target,
    add: target.source,
    removals: installed.filter((name) => name !== target.package).sort(),
  }
}

export function renderCommands(plan, profile, dsh = 'dsh') {
  const commands = []
  if (plan.add) commands.push([dsh, 'plugin', '--profile', profile, 'add', plan.add])
  for (const name of plan.removals) commands.push([dsh, 'plugin', '--profile', profile, 'remove', name])
  return commands
}

function run(command, args, dryRun, env = process.env) {
  console.log(`$ ${[command, ...args].join(' ')}`)
  if (dryRun) return
  const result = spawnSync(command, args, { stdio: 'inherit', env })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`${command} exited with ${result.status}`)
}

function getFlag(args, name, fallback) {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : fallback
}

function hasFlag(args, name) {
  return args.includes(name)
}

function positional(args) {
  const result = []
  for (let index = 0; index < args.length; index++) {
    if (args[index].startsWith('--')) {
      if (['--profile', '--output', '--source-dir'].includes(args[index])) index++
      continue
    }
    result.push(args[index])
  }
  return result
}

function displayName(name) {
  return name.split('-').map((word) => word[0].toUpperCase() + word.slice(1)).join(' ')
}

function replaceTokens(path, replacements) {
  if (statSync(path).isDirectory()) {
    for (const entry of readdirSync(path)) replaceTokens(join(path, entry), replacements)
    return
  }
  if (/\.(png|jpe?g|webp|gif|ico)$/i.test(path)) return
  let text = readFileSync(path, 'utf8')
  for (const [token, value] of Object.entries(replacements)) text = text.split(token).join(value)
  writeFileSync(path, text)
  const nextName = basename(path).replaceAll('__SKIN_ID__', replacements.__SKIN_ID__)
  if (nextName !== basename(path)) renameSync(path, join(dirname(path), nextName))
}

export function createSkin(name, options = {}) {
  if (!namePattern.test(name)) throw new Error('skin name must be kebab-case, for example moon-rabbit')
  const collection = options.collection === true
  const output = options.output
    ? resolve(options.output)
    : collection
      ? join(kitRoot, 'packages', 'skins', name)
      : resolve(`dsh-skin-${name}`)
  if (existsSync(output)) throw new Error(`destination already exists: ${output}`)
  mkdirSync(dirname(output), { recursive: true })
  cpSync(join(kitRoot, 'templates', 'skin'), output, { recursive: true })
  const packageScope = '@xiaoyao-community'
  replaceTokens(output, {
    __SKIN_ID__: name,
    __DISPLAY_NAME__: displayName(name),
    __PACKAGE_NAME__: `${packageScope}/dsh-client-ui-skin-${name}`,
    __SHARED_IMPORT__: collection ? '../../../shared/tsdown.client.ts' : './shared/tsdown.client.ts',
  })
  if (!collection) {
    mkdirSync(join(output, 'shared'), { recursive: true })
    cpSync(join(kitRoot, 'shared', 'tsdown.client.ts'), join(output, 'shared', 'tsdown.client.ts'))
    cpSync(join(kitRoot, 'shared', 'web-platform.ts'), join(output, 'shared', 'web-platform.ts'))
  }
  return output
}

function usage() {
  console.log(`夕小瑶 DSH 皮肤工具\n\n使用：\n  xiaoyao-skin list\n  xiaoyao-skin use <skin|official> [--profile web] [--dry-run]\n  xiaoyao-skin current [--profile web]\n  xiaoyao-skin create <kebab-case-name> [--output path]\n  xiaoyao-skin doctor <skin-directory>\n  xiaoyao-skin submit\n\n一行体验：\n  npx --yes --package=https://github.com/147228/dsh-xiaoyao-skins/releases/latest/download/xiaoyao-skin-kit.tgz xiaoyao-skin use black-whale`)
}

async function main() {
  const args = process.argv.slice(2)
  const command = args[0]
  const rest = args.slice(1)
  const sourceDirectory = getFlag(rest, '--source-dir', process.env.XIAOYAO_SKIN_SOURCE_DIR)
  const catalog = useLocalReleaseDirectory(loadCatalog(), sourceDirectory)
  const profile = getFlag(rest, '--profile', 'web')
  const dshHome = process.env.DSH_HOME || join(homedir(), '.dsh')
  const dsh = process.env.XIAOYAO_SKIN_DSH_BIN || 'dsh'
  const dryRun = hasFlag(rest, '--dry-run')

  if (command === 'list') {
    for (const skin of catalog.skins) console.log(`${skin.slug.padEnd(24)} ${skin.name} · ${skin.tagline}`)
    console.log(`${'official'.padEnd(24)} DeepSeek Harness 原生界面`)
    return
  }
  if (command === 'use' || command === 'install') {
    const target = positional(rest)[0]
    if (!target) throw new Error('missing skin name')
    const { manifest } = readProfileManifest(dshHome, profile)
    const plan = planSwitch(manifest, catalog, target)
    let runtime = { env: process.env, source: 'dry-run', cleanup() {} }
    if (!dryRun) {
      assertSupportedNode()
      assertDshAvailable(dsh)
      runtime = preparePluginManagerEnvironment()
      if (runtime.source !== 'pnpm') {
        console.log(`ℹ 未检测到兼容的全局 pnpm，已通过 ${runtime.source === 'corepack' ? 'Corepack' : 'npx'} 为本次操作临时提供 pnpm ${runtime.version}。`)
      }
    }
    try {
      for (const [program, ...argv] of renderCommands(plan, profile, dsh)) run(program, argv, dryRun, runtime.env)
    } finally {
      runtime.cleanup()
    }
    console.log(plan.target
      ? `\n✓ 已启用 ${plan.target.name}。重启或刷新 dsh web 即可看到。其他 DSH 插件未改动。`
      : '\n✓ 已移除夕小瑶合集皮肤，恢复 DeepSeek Harness 原生界面。其他 DSH 插件未改动。')
    return
  }
  if (command === 'current') {
    const { manifest } = readProfileManifest(dshHome, profile)
    const known = new Set(catalog.skins.map((skin) => skin.package))
    const installed = Object.keys(manifest.dependencies ?? {}).filter((name) => known.has(name))
    if (installed.length === 0) console.log('official')
    else for (const name of installed) console.log(catalog.skins.find((skin) => skin.package === name)?.slug ?? name)
    return
  }
  if (command === 'create') {
    const name = positional(rest)[0]
    if (!name) throw new Error('missing skin name')
    const output = createSkin(name, { collection: hasFlag(rest, '--collection'), output: getFlag(rest, '--output') })
    console.log(`✓ 已创建 ${output}`)
    console.log('下一步：替换预览与视觉变量，然后运行 pnpm install && pnpm check。')
    return
  }
  if (command === 'doctor') {
    const path = positional(rest)[0] ?? process.cwd()
    run(process.execPath, [join(kitRoot, 'scripts', 'validate-skins.mjs'), '--path', path], false)
    return
  }
  if (command === 'submit') {
    console.log('提案：https://github.com/147228/dsh-xiaoyao-skins/issues/new?template=skin_proposal.yml')
    console.log('贡献规范：https://github.com/147228/dsh-xiaoyao-skins/blob/main/CONTRIBUTING.md')
    return
  }
  usage()
  if (command) process.exitCode = 1
}

if (isMainModule(process.argv[1])) {
  main().catch((error) => {
    console.error(`xiaoyao-skin: ${error.message}`)
    process.exitCode = 1
  })
}
