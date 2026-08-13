#!/usr/bin/env node
import { existsSync, lstatSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const requestedPath = process.argv.includes('--path') ? process.argv[process.argv.indexOf('--path') + 1] : undefined
const targets = requestedPath
  ? [resolve(process.cwd(), requestedPath)]
  : readdirSync(join(root, 'packages', 'skins')).sort().map((name) => join(root, 'packages', 'skins', name))

const errors = []
const warnings = []
const seen = { id: new Map(), pkg: new Map(), body: new Map(), wiring: new Map() }
const fail = (dir, message) => errors.push(`${relative(root, dir)}: ${message}`)
const warn = (dir, message) => warnings.push(`${relative(root, dir)}: ${message}`)
const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'))
const allText = (dir, files) => files.filter((file) => existsSync(join(dir, file))).map((file) => readFileSync(join(dir, file), 'utf8')).join('\n')

for (const dir of targets) {
  if (!existsSync(dir) || !lstatSync(dir).isDirectory()) {
    fail(dir, 'skin directory does not exist')
    continue
  }
  const slug = dir.split('/').at(-1)
  const required = [
    'package.json', 'skin.json', 'cordis.patch.yml', 'README.md',
    'LICENSE', 'ASSET_LICENSE.md', 'THIRD_PARTY_NOTICES.md',
    'src/index.ts', 'src/client/index.ts', 'tests/apply.spec.ts',
    'tsdown.config.ts', 'tsconfig.json', 'tsconfig.vitest.json', 'vitest.config.ts',
  ]
  for (const file of required) if (!existsSync(join(dir, file))) fail(dir, `missing ${file}`)
  if (errors.some((line) => line.startsWith(`${relative(root, dir)}:`)) && (!existsSync(join(dir, 'package.json')) || !existsSync(join(dir, 'skin.json')))) continue

  let pkg
  let skin
  try { pkg = readJson(join(dir, 'package.json')) } catch (error) { fail(dir, `invalid package.json: ${error.message}`); continue }
  try { skin = readJson(join(dir, 'skin.json')) } catch (error) { fail(dir, `invalid skin.json: ${error.message}`); continue }

  if (!/^@xiaoyao-(ai|community)\/dsh-client-ui-skin-[a-z0-9-]+$/.test(pkg.name ?? '')) fail(dir, 'package name must use the approved skin scope and kebab-case suffix')
  if (pkg.private !== true) fail(dir, 'package.json must keep private:true; releases are GitHub assets, not accidental npm publishes')
  if (pkg.license !== 'SEE LICENSE IN LICENSE') fail(dir, 'package license must point to the bundled LICENSE')
  if (pkg.main !== 'lib/index.js' || pkg.exports?.['./client'] !== './lib/client.js') fail(dir, 'exports must expose lib/index.js and lib/client.js')
  if (pkg.dsh?.bundle?.patch !== './cordis.patch.yml' || pkg.dsh?.client?.platform !== 'web') fail(dir, 'missing official DSH bundle/client manifest shape')
  for (const script of ['pretypecheck', 'pretest', 'prebuild', 'typecheck', 'test', 'build']) {
    if (!pkg.scripts?.[script]) fail(dir, `missing scripts.${script}`)
  }
  for (const file of ['lib', 'cordis.patch.yml', 'skin.json', 'README.md', 'LICENSE', 'ASSET_LICENSE.md', 'THIRD_PARTY_NOTICES.md']) {
    if (!(pkg.files ?? []).includes(file)) fail(dir, `package files must include ${file}`)
  }

  const requiredSkinText = ['id', 'name', 'nameEn', 'author', 'tagline', 'description', 'accent', 'bodyAttr', 'package', 'version']
  for (const key of requiredSkinText) if (typeof skin[key] !== 'string' || skin[key].trim() === '') fail(dir, `skin.json ${key} must be non-empty`)
  if (skin.package !== pkg.name) fail(dir, 'skin.package must match package.json name')
  if (skin.version !== pkg.version) fail(dir, 'skin.version must match package.json version')
  if (!/^xiaoyao-[a-z0-9-]+$/.test(skin.id ?? '')) fail(dir, 'skin.id must start with xiaoyao-')
  if (!/^data-dsh-[a-z0-9-]+$/.test(skin.bodyAttr ?? '')) fail(dir, 'bodyAttr must be data-dsh-*')
  if (!/^ui-skin-[a-z0-9-]+$/.test(skin.wiring?.id ?? '')) fail(dir, 'wiring.id must be ui-skin-*')
  if (skin.wiring?.bundleWired !== true) fail(dir, 'wiring.bundleWired must be true for one-command DSH installation')
  if (!Array.isArray(skin.tags) || skin.tags.length < 3) fail(dir, 'at least three tags are required')
  if (!skin.preview?.dark || !existsSync(join(dir, skin.preview?.dark ?? ''))) fail(dir, 'preview.dark must point to an existing image')
  else {
    const preview = join(dir, skin.preview.dark)
    const allowed = ['.png', '.jpg', '.jpeg', '.webp', '.svg']
    if (!allowed.includes(extname(preview).toLowerCase())) fail(dir, 'preview must be png, jpg, webp, or svg')
    const bytes = statSync(preview).size
    const minimum = extname(preview).toLowerCase() === '.svg' ? 500 : 10_000
    if (bytes < minimum) fail(dir, 'preview image is too small to review')
    if (bytes > 5_000_000) fail(dir, 'preview image exceeds 5 MB')
  }

  for (const [kind, value] of [['id', skin.id], ['pkg', pkg.name], ['body', skin.bodyAttr], ['wiring', skin.wiring?.id]]) {
    const previous = seen[kind].get(value)
    if (previous) fail(dir, `${kind} duplicates ${relative(root, previous)}`)
    else seen[kind].set(value, dir)
  }

  const patch = existsSync(join(dir, 'cordis.patch.yml')) ? readFileSync(join(dir, 'cordis.patch.yml'), 'utf8') : ''
  if (!patch.includes(`id: ${skin.wiring?.id}`) || !patch.includes(`name: '${pkg.name}'`)) fail(dir, 'cordis.patch.yml must insert the declared wiring id and package')

  const sourceFiles = ['src/index.ts', 'src/client/index.ts']
  const source = allText(dir, sourceFiles)
  const cssFiles = readdirSync(join(dir, 'src', 'client')).filter((name) => name.endsWith('.module.css')).map((name) => `src/client/${name}`)
  const css = allText(dir, cssFiles)
  const test = existsSync(join(dir, 'tests/apply.spec.ts')) ? readFileSync(join(dir, 'tests/apply.spec.ts'), 'utf8') : ''
  if (!source.includes(skin.bodyAttr) && !css.includes(`body[${skin.bodyAttr}]`)) fail(dir, 'source must scope the skin with its declared bodyAttr')
  if (!source.includes('ctx.effect') && !source.includes('mountGreatWallSkin')) fail(dir, 'client apply must register reversible cleanup through ctx.effect')
  if (!test.includes('dispose')) fail(dir, 'apply test must exercise disposal')
  if (/\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b|\bEventSource\b|sendBeacon\s*\(/.test(source)) fail(dir, 'skin runtime may not make network requests')
  for (const match of source.matchAll(/from\s+['"](@deepseek-ai\/[^'"]+)['"]/g)) {
    if (match[1] !== '@deepseek-ai/cordis') fail(dir, `skin runtime may not import functional DSH service ${match[1]}`)
  }
  const textSurface = allText(dir, ['package.json', 'skin.json', 'cordis.patch.yml', 'src/index.ts', 'src/client/index.ts', ...cssFiles, 'tests/apply.spec.ts', 'tsdown.config.ts'])
  if (/\/Users\/|[A-Za-z]:\\Users\\|xwechat_files|wxid_/.test(textSurface)) fail(dir, 'local path or account artifact detected')
  const assetDir = join(dir, 'assets')
  if (existsSync(assetDir)) {
    const bytes = readdirSync(assetDir).reduce((sum, name) => sum + statSync(join(assetDir, name)).size, 0)
    if (bytes > 20_000_000) warn(dir, `assets total ${(bytes / 1_000_000).toFixed(1)} MB; consider optimized delivery copies`)
  }
  console.log(`[skin] checked ${slug}`)
}

for (const line of warnings) console.warn(`[skin] WARN ${line}`)
if (errors.length) {
  for (const line of errors) console.error(`[skin] ERROR ${line}`)
  console.error(`[skin] FAILED ${errors.length} error(s), ${warnings.length} warning(s)`)
  process.exit(1)
}
console.log(`[skin] OK ${targets.length} skin(s), ${warnings.length} warning(s)`)
