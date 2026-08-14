#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const skinsDir = join(root, 'packages', 'skins')
const catalogPath = join(root, 'catalog', 'skins.json')
const check = process.argv.includes('--check')
const collection = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const installer = 'npx --yes --package=https://github.com/147228/dsh-xiaoyao-skins/releases/latest/download/xiaoyao-skin-kit.tgz xiaoyao-skin'

const requiredText = ['id', 'name', 'nameEn', 'author', 'tagline', 'description', 'accent', 'bodyAttr', 'package', 'version']
const entries = []
for (const slug of readdirSync(skinsDir).sort()) {
  const dir = join(skinsDir, slug)
  const manifestPath = join(dir, 'skin.json')
  const packagePath = join(dir, 'package.json')
  if (!existsSync(manifestPath) || !existsSync(packagePath)) continue
  const skin = JSON.parse(readFileSync(manifestPath, 'utf8'))
  const pkg = JSON.parse(readFileSync(packagePath, 'utf8'))
  for (const key of requiredText) {
    if (typeof skin[key] !== 'string' || skin[key].trim() === '') {
      throw new Error(`${relative(root, manifestPath)}: ${key} must be a non-empty string`)
    }
  }
  if (skin.package !== pkg.name) throw new Error(`${slug}: skin.package does not match package.json name`)
  if (skin.version !== pkg.version) throw new Error(`${slug}: skin.version does not match package.json version`)
  if (!skin.preview?.dark) throw new Error(`${slug}: skin.preview.dark is required`)
  if (!existsSync(join(dir, skin.preview.dark))) throw new Error(`${slug}: preview not found: ${skin.preview.dark}`)
  const releaseAsset = `xiaoyao-skin-${slug}.tgz`
  entries.push({
    slug,
    id: skin.id,
    name: skin.name,
    nameEn: skin.nameEn,
    author: skin.author,
    tagline: skin.tagline,
    description: skin.description,
    tags: [...new Set(skin.tags ?? [])].sort(),
    accent: skin.accent,
    bodyAttr: skin.bodyAttr,
    package: skin.package,
    version: skin.version,
    wiringId: skin.wiring?.id,
    preview: `packages/skins/${slug}/${skin.preview.dark}`,
    releaseAsset,
    source: `https://github.com/147228/dsh-xiaoyao-skins/releases/latest/download/${releaseAsset}`,
    install: `${installer} use ${slug}`,
    order: Number.isFinite(skin.order) ? skin.order : 1000,
  })
}
entries.sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug))

const catalog = {
  schemaVersion: 1,
  collection: collection.name,
  version: collection.version,
  compatibility: { dsh: '0.1.0-rc.6', node: '>=20' },
  repository: 'https://github.com/147228/dsh-xiaoyao-skins',
  skins: entries,
}
const rendered = `${JSON.stringify(catalog, null, 2)}\n`

if (check) {
  if (!existsSync(catalogPath) || readFileSync(catalogPath, 'utf8') !== rendered) {
    console.error('[catalog] catalog/skins.json is stale; run pnpm catalog:build')
    process.exit(1)
  }
  console.log(`[catalog] OK ${entries.length} skins`)
} else {
  mkdirSync(dirname(catalogPath), { recursive: true })
  writeFileSync(catalogPath, rendered)
  console.log(`[catalog] wrote ${relative(root, catalogPath)} (${entries.length} skins)`)
}
