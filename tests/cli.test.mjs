import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { createSkin, loadCatalog, planSwitch, renderCommands, useLocalReleaseDirectory } from '../bin/xiaoyao-skin.mjs'

const catalog = loadCatalog()

test('catalog exposes a real multi-skin collection', () => {
  assert.equal(catalog.skins.length, 6)
  assert.equal(new Set(catalog.skins.map((skin) => skin.slug)).size, 6)
})

test('switch plan preserves every non-skin DSH dependency', () => {
  const current = catalog.skins[0]
  const target = catalog.skins[1]
  const manifest = {
    dependencies: {
      [current.package]: current.source,
      '@deepseek-ai/dsh-tool-bash': '1.0.0',
      '@deepseek-ai/dsh-tool-fs': '1.0.0',
      'third-party-important-plugin': '2.4.0',
    },
    dsh: { profile: { bundles: [current.package, '@deepseek-ai/dsh-tool-bash'] } },
  }
  const plan = planSwitch(manifest, catalog, target.slug)
  assert.equal(plan.add, target.source)
  assert.deepEqual(plan.removals, [current.package])
  const commands = renderCommands(plan, 'web')
  assert.deepEqual(commands[0], ['dsh', 'plugin', '--profile', 'web', 'add', target.source])
  assert.deepEqual(commands[1], ['dsh', 'plugin', '--profile', 'web', 'remove', current.package])
})

test('official mode removes only registered collection skins', () => {
  const installed = catalog.skins.slice(0, 2)
  const manifest = {
    dependencies: {
      [installed[0].package]: 'a',
      [installed[1].package]: 'b',
      '@deepseek-ai/dsh-session': 'keep-me',
    },
  }
  const plan = planSwitch(manifest, catalog, 'official')
  assert.equal(plan.add, null)
  assert.deepEqual(plan.removals, installed.map((skin) => skin.package).sort())
})

test('release smoke mode resolves every source to the isolated local directory', () => {
  const localDirectory = resolve('release-fixture')
  const local = useLocalReleaseDirectory(catalog, localDirectory)
  for (const skin of local.skins) {
    assert.equal(skin.source, join(localDirectory, skin.releaseAsset))
  }
})

test('creator command produces a token-free skin that passes doctor', () => {
  const parent = mkdtempSync(join(tmpdir(), 'xiaoyao-skin-create-'))
  const output = join(parent, 'moon-rabbit')
  createSkin('moon-rabbit', { output })
  assert.match(readFileSync(join(output, 'package.json'), 'utf8'), /@xiaoyao-community\/dsh-client-ui-skin-moon-rabbit/)
  const source = readFileSync(join(output, 'src', 'client', 'index.ts'), 'utf8')
  assert.equal(source.includes('__SKIN_ID__'), false)
  const result = spawnSync(process.execPath, ['scripts/validate-skins.mjs', '--path', output], {
    cwd: new URL('..', import.meta.url),
    encoding: 'utf8',
  })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
})
