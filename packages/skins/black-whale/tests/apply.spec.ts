// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { Context, type Fiber } from '@deepseek-ai/cordis'
import { apply } from '../src/client/index.ts'

let fiber: Fiber | undefined

async function mount(): Promise<Fiber> {
  const mounted = new Context().plugin({ apply })
  await mounted.await()
  return mounted
}

afterEach(async () => {
  await fiber?.dispose()
  fiber = undefined
  document.body.innerHTML = ''
  document.body.removeAttribute('style')
  document.body.removeAttribute('data-dsh-black-whale-focus')
  document.title = ''
})

describe('black whale skin', () => {
  it('sets and retracts its body scope', async () => {
    fiber = await mount()
    expect(document.body.hasAttribute('data-dsh-black-whale')).toBe(true)
    await fiber.dispose()
    expect(document.body.hasAttribute('data-dsh-black-whale')).toBe(false)
  })

  it('toggles focus mode and retracts the state', async () => {
    fiber = await mount()
    const button = document.querySelector<HTMLButtonElement>('[data-skin-chrome="focus-button"]')
    button?.click()
    expect(document.body.hasAttribute('data-dsh-black-whale-focus')).toBe(true)
    expect(button?.getAttribute('aria-pressed')).toBe('true')
    await fiber.dispose()
    expect(document.body.hasAttribute('data-dsh-black-whale-focus')).toBe(false)
  })

  it('restores title, backdrop and injected chrome', async () => {
    document.title = 'original'
    document.body.style.backgroundPosition = 'left top'
    fiber = await mount()
    expect(document.title).toContain('黑鲸实验室')
    await fiber.dispose()
    expect(document.title).toBe('original')
    expect(document.body.style.backgroundPosition).toBe('left top')
    expect(document.querySelectorAll('[data-skin-chrome]')).toHaveLength(0)
  })

  it('guards light controls without depending on generated DSH class names', async () => {
    const button = document.createElement('button')
    button.style.backgroundColor = 'rgb(255, 255, 255)'
    button.style.color = 'rgb(244, 244, 245)'
    document.body.append(button)
    fiber = await mount()
    await new Promise<void>(resolve => queueMicrotask(resolve))
    expect(button.hasAttribute('data-dsh-black-whale-ink')).toBe(true)
    await fiber.dispose()
    expect(button.hasAttribute('data-dsh-black-whale-ink')).toBe(false)
  })
})
