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
  document.title = ''
})

describe('Xiaoyao skin apply', () => {
  it('sets and retracts its body scope', async () => {
    fiber = await mount()
    expect(document.body.hasAttribute('data-dsh-xiaoyao')).toBe(true)
    await fiber.dispose()
    expect(document.body.hasAttribute('data-dsh-xiaoyao')).toBe(false)
  })

  it('opens the guide and removes all chrome on dispose', async () => {
    fiber = await mount()
    const launcher = document.querySelector<HTMLButtonElement>('[data-skin-chrome="guide-launcher"]')
    expect(launcher).not.toBeNull()
    launcher?.click()
    expect(launcher?.getAttribute('aria-expanded')).toBe('true')
    await fiber.dispose()
    expect(document.querySelectorAll('[data-skin-chrome]')).toHaveLength(0)
  })

  it('restores pre-existing title and backdrop values', async () => {
    document.title = 'original'
    document.body.style.backgroundPosition = 'left top'
    fiber = await mount()
    expect(document.title).toContain('夕小瑶')
    await fiber.dispose()
    expect(document.title).toBe('original')
    expect(document.body.style.backgroundPosition).toBe('left top')
  })
})
