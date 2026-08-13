// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { Context, type Fiber } from '@deepseek-ai/cordis'
import { apply } from '../src/client/index.ts'

let fiber: Fiber | undefined
afterEach(async () => {
  await fiber?.dispose()
  fiber = undefined
  document.body.innerHTML = ''
  document.body.removeAttribute('style')
  document.title = ''
})

describe('__DISPLAY_NAME__ skin', () => {
  it('sets and retracts its complete presentation surface', async () => {
    document.title = 'original'
    fiber = new Context().plugin({ apply })
    await fiber.await()
    expect(document.body.hasAttribute('data-dsh-__SKIN_ID__')).toBe(true)
    expect(document.querySelectorAll('[data-skin-chrome]')).toHaveLength(1)
    await fiber.dispose()
    expect(document.body.hasAttribute('data-dsh-__SKIN_ID__')).toBe(false)
    expect(document.querySelectorAll('[data-skin-chrome]')).toHaveLength(0)
    expect(document.title).toBe('original')
  })
})
