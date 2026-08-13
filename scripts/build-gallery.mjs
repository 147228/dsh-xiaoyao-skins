#!/usr/bin/env node
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const site = join(root, 'site')
const catalog = JSON.parse(readFileSync(join(root, 'catalog', 'skins.json'), 'utf8'))
rmSync(site, { recursive: true, force: true })
mkdirSync(join(site, 'previews'), { recursive: true })

const published = structuredClone(catalog)
for (const skin of published.skins) {
  const source = join(root, skin.preview)
  const target = `previews/${skin.slug}${basename(source).slice(basename(source).lastIndexOf('.'))}`
  cpSync(source, join(site, target))
  skin.preview = target
}
cpSync(join(root, 'gallery', 'index.html'), join(site, 'index.html'))
cpSync(join(root, 'gallery', 'styles.css'), join(site, 'styles.css'))
cpSync(join(root, 'gallery', 'app.js'), join(site, 'app.js'))
writeFileSync(join(site, 'catalog.json'), `${JSON.stringify(published, null, 2)}\n`)
writeFileSync(join(site, '.nojekyll'), '')
console.log(`[gallery] built ${published.skins.length} cards in site/`)
