// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { Context, type Fiber } from '@deepseek-ai/cordis'
import { apply } from '../src/client/index.ts'

let fiber: Fiber | undefined
async function mount(): Promise<Fiber> { const mounted = new Context().plugin({ apply }); await mounted.await(); return mounted }
afterEach(async () => { await fiber?.dispose(); fiber = undefined; document.body.innerHTML = ''; document.body.removeAttribute('style'); document.body.removeAttribute('data-dsh-great-wall-focus'); document.title = '' })

describe('Great Wall Morning Glow skin', () => {
  it('sets and retracts both common and theme scopes', async () => {
    fiber = await mount()
    expect(document.body.hasAttribute('data-dsh-great-wall-skin')).toBe(true)
    expect(document.body.hasAttribute('data-dsh-great-wall-sunrise')).toBe(true)
    await fiber.dispose()
    expect(document.body.hasAttribute('data-dsh-great-wall-skin')).toBe(false)
    expect(document.body.hasAttribute('data-dsh-great-wall-sunrise')).toBe(false)
  })

  it('toggles focus mode and restores title and backdrop', async () => {
    document.title = 'original'
    document.body.style.backgroundPosition = 'left top'
    fiber = await mount()
    const button = document.querySelector<HTMLButtonElement>('[data-skin-chrome="focus-button"]')
    button?.click()
    expect(document.body.hasAttribute('data-dsh-great-wall-focus')).toBe(true)
    await fiber.dispose()
    expect(document.title).toBe('original')
    expect(document.body.style.backgroundPosition).toBe('left top')
    expect(document.querySelectorAll('[data-skin-chrome]')).toHaveLength(0)
  })

  it('guards light-on-light controls without DSH class names', async () => {
    const control = document.createElement('button')
    control.style.backgroundColor = 'rgb(255, 255, 255)'
    control.style.color = 'rgb(245, 245, 245)'
    document.body.append(control)
    fiber = await mount()
    await new Promise<void>(resolve => queueMicrotask(resolve))
    expect(control.hasAttribute('data-dsh-great-wall-ink')).toBe(true)
    await fiber.dispose()
    expect(control.hasAttribute('data-dsh-great-wall-ink')).toBe(false)
  })
})
