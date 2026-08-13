// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { Context, type Fiber } from '@deepseek-ai/cordis'
import { apply } from '../src/client/index.ts'

let fiber: Fiber | undefined
async function mount(): Promise<Fiber> { const mounted = new Context().plugin({ apply }); await mounted.await(); return mounted }
afterEach(async () => { await fiber?.dispose(); fiber = undefined; document.body.innerHTML = ''; document.body.removeAttribute('style'); document.body.removeAttribute('data-dsh-great-wall-focus'); document.title = '' })

describe('Great Wall Snow Pass skin', () => {
  it('sets and retracts both common and theme scopes', async () => {
    fiber = await mount()
    expect(document.body.hasAttribute('data-dsh-great-wall-skin')).toBe(true)
    expect(document.body.hasAttribute('data-dsh-great-wall-snow')).toBe(true)
    await fiber.dispose()
    expect(document.body.hasAttribute('data-dsh-great-wall-skin')).toBe(false)
    expect(document.body.hasAttribute('data-dsh-great-wall-snow')).toBe(false)
  })

  it('toggles focus mode and retracts it', async () => {
    fiber = await mount()
    const button = document.querySelector<HTMLButtonElement>('[data-skin-chrome="focus-button"]')
    button?.click()
    expect(button?.getAttribute('aria-pressed')).toBe('true')
    await fiber.dispose()
    expect(document.body.hasAttribute('data-dsh-great-wall-focus')).toBe(false)
  })

  it('restores title, backdrop and chrome', async () => {
    document.title = 'original'
    document.body.style.backgroundPosition = 'left top'
    fiber = await mount()
    expect(document.title).toContain('雪岭长城')
    await fiber.dispose()
    expect(document.title).toBe('original')
    expect(document.body.style.backgroundPosition).toBe('left top')
    expect(document.querySelectorAll('[data-skin-chrome]')).toHaveLength(0)
  })
})
