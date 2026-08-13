// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { Context, type Fiber } from '@deepseek-ai/cordis'
import { apply } from '../src/client/index.ts'
let fiber: Fiber | undefined
async function mount(): Promise<Fiber> { const f=new Context().plugin({apply}); await f.await(); return f }
afterEach(async()=>{await fiber?.dispose();fiber=undefined;document.body.innerHTML='';document.body.removeAttribute('style');document.title=''})
describe('Sky Lab skin',()=>{
  it('retracts its scope and chrome',async()=>{fiber=await mount();expect(document.body.hasAttribute('data-dsh-sky-lab')).toBe(true);expect(document.querySelectorAll('[data-skin-chrome]')).toHaveLength(3);await fiber.dispose();expect(document.body.hasAttribute('data-dsh-sky-lab')).toBe(false);expect(document.querySelectorAll('[data-skin-chrome]')).toHaveLength(0)})
  it('opens the twin guide',async()=>{fiber=await mount();const button=document.querySelector<HTMLButtonElement>('[data-skin-chrome="sky-launcher"]');button?.click();expect(button?.getAttribute('aria-expanded')).toBe('true')})
})
