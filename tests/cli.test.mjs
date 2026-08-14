import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import {
  assertDshAvailable,
  assertSupportedNode,
  compatiblePnpmVersion,
  createSkin,
  isMainModule,
  loadCatalog,
  nodeMajor,
  planSwitch,
  preparePluginManagerEnvironment,
  renderCommands,
  useLocalReleaseDirectory,
} from '../bin/xiaoyao-skin.mjs'

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

test('installed bin symlinks resolve to the real CLI module', () => {
  const canonicalize = (path) => path === '/installed/.bin/xiaoyao-skin' ? '/package/bin/xiaoyao-skin.mjs' : path
  assert.equal(isMainModule('/installed/.bin/xiaoyao-skin', '/package/bin/xiaoyao-skin.mjs', canonicalize), true)
  assert.equal(isMainModule('/installed/.bin/other', '/package/bin/xiaoyao-skin.mjs', canonicalize), false)
})

test('runtime guard accepts supported Node versions and explains old runtimes', () => {
  assert.equal(nodeMajor('v24.19.0'), 24)
  assert.equal(nodeMajor('20.20.2'), 20)
  assert.doesNotThrow(() => assertSupportedNode('24.0.0'))
  assert.doesNotThrow(() => assertSupportedNode('20.20.2'))
  assert.throws(
    () => assertSupportedNode('18.20.8'),
    /需要 Node\.js 20.*当前为 18\.20\.8.*推荐使用 Node\.js 24 LTS/s,
  )
})

test('pnpm fallback follows the active Node runtime', () => {
  assert.equal(compatiblePnpmVersion('20.20.2'), '10.34.5')
  assert.equal(compatiblePnpmVersion('22.12.0'), '10.34.5')
  assert.equal(compatiblePnpmVersion('22.13.0'), '11.19.0')
  assert.equal(compatiblePnpmVersion('24.19.0'), '11.19.0')
})

test('plugin runtime keeps an already working pnpm unchanged', () => {
  const calls = []
  const runtime = preparePluginManagerEnvironment({
    env: { PATH: '/usr/bin' },
    spawn(command, args) {
      calls.push([command, ...args])
      return { status: command === 'pnpm' ? 0 : 1, stdout: '11.19.0\n' }
    },
  })
  assert.equal(runtime.source, 'pnpm')
  assert.equal(runtime.env.PATH, '/usr/bin')
  assert.deepEqual(calls, [['pnpm', '--version']])
})

test('plugin runtime creates and removes a process-local Corepack proxy', () => {
  const calls = []
  const removed = []
  const proxies = []
  const runtime = preparePluginManagerEnvironment({
    env: { PATH: '/usr/bin' },
    platform: 'linux',
    pathDelimiter: ':',
    makeTempDir: () => '/tmp/xiaoyao-corepack-test',
    removeTempDir: (path) => removed.push(path),
    writeProxy: (...args) => proxies.push(args),
    nodeVersion: '20.20.2',
    spawn(command, args, options) {
      calls.push([command, ...args, options.env.PATH])
      if (command === 'pnpm' && options.env.PATH === '/usr/bin') {
        return { status: null, error: { code: 'ENOENT', message: 'not found' } }
      }
      return { status: 0, stdout: command === 'pnpm' ? '11.19.0\n' : '0.34.6\n' }
    },
  })
  assert.equal(runtime.source, 'corepack')
  assert.equal(runtime.version, '10.34.5')
  assert.equal(runtime.env.PATH, '/tmp/xiaoyao-corepack-test:/usr/bin')
  assert.equal(runtime.env.COREPACK_ENABLE_DOWNLOAD_PROMPT, '0')
  assert.deepEqual(calls.map((call) => call.slice(0, -1)), [
    ['pnpm', '--version'],
    ['corepack', '--version'],
    ['pnpm', '--version'],
  ])
  assert.deepEqual(proxies, [['/tmp/xiaoyao-corepack-test', 'linux', 'corepack', '10.34.5']])
  runtime.cleanup()
  assert.deepEqual(removed, ['/tmp/xiaoyao-corepack-test'])
})

test('plugin runtime respects the Windows Path key', () => {
  const runtime = preparePluginManagerEnvironment({
    env: { Path: 'C:\\Windows\\System32' },
    platform: 'win32',
    pathDelimiter: ';',
    makeTempDir: () => 'C:\\Temp\\xiaoyao-corepack-test',
    removeTempDir() {},
    writeProxy() {},
    spawn(command, args, options) {
      if (command === 'pnpm' && options.env.Path === 'C:\\Windows\\System32') {
        return { status: null, error: { code: 'ENOENT', message: 'not found' } }
      }
      return { status: 0, stdout: 'ok\n' }
    },
  })
  assert.equal(runtime.env.Path, 'C:\\Temp\\xiaoyao-corepack-test;C:\\Windows\\System32')
})

test('npx is used when pnpm and Corepack are unavailable', () => {
  const proxies = []
  const runtime = preparePluginManagerEnvironment({
    env: { PATH: '/usr/bin' },
    makeTempDir: () => '/tmp/xiaoyao-npx-test',
    removeTempDir() {},
    writeProxy: (...args) => proxies.push(args),
    spawn(command, args, options) {
      if (command === 'pnpm' && options.env.PATH.startsWith('/tmp/xiaoyao-npx-test')) {
        return { status: 0, stdout: '10.34.5\n' }
      }
      if (command === 'npx') return { status: 0, stdout: '10.8.2\n' }
      return { status: null, error: { code: 'ENOENT', message: 'not found' } }
    },
  })
  assert.equal(runtime.source, 'npx')
  assert.deepEqual(proxies, [['/tmp/xiaoyao-npx-test', process.platform, 'npx', compatiblePnpmVersion()]])
})

test('missing pnpm, Corepack and npx returns an actionable error', () => {
  assert.throws(
    () => preparePluginManagerEnvironment({
      env: { PATH: '/usr/bin' },
      spawn() {
        return { status: null, error: { code: 'ENOENT', message: 'not found' } }
      },
    }),
    /没有可用的 pnpm、Corepack 或 npx.*Node\.js 24 LTS/s,
  )
})

test('DSH preflight reports a missing executable before package-manager work', () => {
  assert.doesNotThrow(() => assertDshAvailable('dsh', {
    spawn: () => ({ status: 0, stdout: '0.1.0-rc.6\n' }),
  }))
  assert.throws(
    () => assertDshAvailable('dsh', {
      spawn: () => ({ status: null, error: { code: 'ENOENT', message: 'not found' } }),
    }),
    /找不到可用的 DeepSeek Harness 命令.*npm install -g @deepseek-ai\/dsh/s,
  )
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
