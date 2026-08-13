import type { Context } from '@deepseek-ai/cordis'
import css from './__SKIN_ID__.module.css'

const title = '__DISPLAY_NAME__ · DeepSeek Harness'
const cls = (name: keyof typeof css): string => css[name] ?? ''

/** Mount presentation-only chrome and retract every write on dispose. */
export function apply(ctx: Context): void {
  const body = document.body
  const previousTitle = document.title
  body.setAttribute('data-dsh-__SKIN_ID__', '')

  const badge = document.createElement('div')
  badge.className = cls('badge')
  badge.dataset.skinChrome = '__SKIN_ID__-badge'
  badge.innerHTML = '<strong>__DISPLAY_NAME__</strong><span>COMMUNITY SKIN</span>'
  body.append(badge)
  document.title = title

  ctx.effect(() => () => {
    body.removeAttribute('data-dsh-__SKIN_ID__')
    badge.remove()
    if (document.title === title) document.title = previousTitle
  }, 'ui-skin-community-__SKIN_ID__: reversible presentation')
}
