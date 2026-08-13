#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const release = join(root, 'release')
const raw = join(release, 'raw')
rmSync(release, { recursive: true, force: true })
mkdirSync(raw, { recursive: true })
const catalog = JSON.parse(readFileSync(join(root, 'catalog', 'skins.json'), 'utf8'))

function pack(filter, stableName) {
  const before = new Set(readdirSync(raw))
  const result = spawnSync('pnpm', ['--filter', filter, 'pack', '--pack-destination', raw], { cwd: root, stdio: 'inherit' })
  if (result.status !== 0) process.exit(result.status ?? 1)
  const added = readdirSync(raw).filter((name) => !before.has(name) && name.endsWith('.tgz'))
  if (added.length !== 1) throw new Error(`expected one tarball for ${filter}, found ${added.join(', ')}`)
  renameSync(join(raw, added[0]), join(release, stableName))
}

for (const skin of catalog.skins) pack(skin.package, skin.releaseAsset)
pack('@xiaoyao-ai/dsh-xiaoyao-skins', 'xiaoyao-skin-kit.tgz')
rmSync(raw, { recursive: true, force: true })

const sums = []
for (const name of readdirSync(release).filter((name) => name.endsWith('.tgz')).sort()) {
  const digest = createHash('sha256').update(readFileSync(join(release, name))).digest('hex')
  sums.push(`${digest}  ${name}`)
}
writeFileSync(join(release, 'SHA256SUMS.txt'), `${sums.join('\n')}\n`)
writeFileSync(join(release, 'catalog.json'), `${JSON.stringify(catalog, null, 2)}\n`)
console.log(`[release] ready ${sums.length} package(s) in ${release}`)
