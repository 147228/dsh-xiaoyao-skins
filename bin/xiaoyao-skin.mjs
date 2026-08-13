#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, statSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const kitRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const catalogPath = join(kitRoot, 'catalog', 'skins.json')
const namePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function loadCatalog(path = catalogPath) {
  return JSON.parse(readFileSync(path, 'utf8'))
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

function run(command, args, dryRun) {
  console.log(`$ ${[command, ...args].join(' ')}`)
  if (dryRun) return
  const result = spawnSync(command, args, { stdio: 'inherit', env: process.env })
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
  console.log(`夕小瑶 DSH 皮肤工具\n\n使用：\n  xiaoyao-skin list\n  xiaoyao-skin use <skin|official> [--profile web] [--dry-run]\n  xiaoyao-skin current [--profile web]\n  xiaoyao-skin create <kebab-case-name> [--output path]\n  xiaoyao-skin doctor <skin-directory>\n  xiaoyao-skin submit\n\n一行体验：\n  npx --yes github:147228/dsh-xiaoyao-skins use black-whale`)
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
    for (const [program, ...argv] of renderCommands(plan, profile, dsh)) run(program, argv, dryRun)
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

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`xiaoyao-skin: ${error.message}`)
    process.exitCode = 1
  })
}
