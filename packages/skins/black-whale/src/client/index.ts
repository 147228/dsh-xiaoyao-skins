import type { Context } from '@deepseek-ai/cordis'
import css from './black-whale.module.css'
import { BLACK_WHALE_LAB, DSH_BLACK_WHALE } from './art.generated.ts'

const TITLE = '夕小瑶 · 黑鲸实验室'
const BACKDROP_PROPERTIES = [
  'background-image',
  'background-position',
  'background-size',
  'background-attachment',
  'background-repeat',
] as const

const CONTRAST_CANDIDATES = [
  'button',
  'input',
  'textarea',
  'select',
  "[role='button']",
  "[role='menuitem']",
  "[role='option']",
].join(',')

const cls = (name: keyof typeof css): string => css[name] ?? ''

function image(src: string, alt: string, className: string): HTMLImageElement {
  const img = document.createElement('img')
  img.src = src
  img.alt = alt
  img.className = className
  return img
}

function rgba(value: string): readonly [number, number, number, number] | undefined {
  const channels = value.match(/[\d.]+/g)?.map(Number)
  if (channels === undefined || channels.length < 3) return undefined
  return [channels[0] ?? 0, channels[1] ?? 0, channels[2] ?? 0, channels[3] ?? 1]
}

function brightness(value: readonly [number, number, number, number]): number {
  return (value[0] * 0.2126 + value[1] * 0.7152 + value[2] * 0.0722) / 255
}

/** Mark a control only when its computed foreground disappears on a light fill. */
function guardControlContrast(element: HTMLElement): void {
  const style = getComputedStyle(element)
  const background = rgba(style.backgroundColor)
  const foreground = rgba(style.color)
  const needsInk = background !== undefined
    && foreground !== undefined
    && background[3] >= 0.55
    && brightness(background) >= 0.82
    && brightness(foreground) >= 0.68
  element.toggleAttribute('data-dsh-black-whale-ink', needsInk)
}

/** Mount a reversible black-whale presentation layer over the DSH Web shell. */
export function apply(ctx: Context): void {
  const body = document.body
  const originalTitle = document.title
  const previous = new Map<string, string>()
  for (const prop of BACKDROP_PROPERTIES) previous.set(prop, body.style.getPropertyValue(prop))

  body.dataset.dshBlackWhale = ''
  let focus = false

  const paintBackdrop = (): void => {
    const scrim = focus
      ? 'linear-gradient(90deg, rgba(2,2,3,.94) 0%, rgba(5,5,7,.80) 58%, rgba(7,7,9,.52) 100%)'
      : 'linear-gradient(90deg, rgba(2,2,3,.64) 0%, rgba(5,5,7,.24) 52%, rgba(7,7,9,0) 100%)'
    body.style.setProperty('background-image', `${scrim}, url(${BLACK_WHALE_LAB})`)
    body.style.setProperty('background-position', 'center right')
    body.style.setProperty('background-size', 'cover')
    body.style.setProperty('background-attachment', 'fixed')
    body.style.setProperty('background-repeat', 'no-repeat')
  }
  paintBackdrop()

  const brand = document.createElement('div')
  brand.className = cls('labBrand')
  brand.dataset.skinChrome = 'lab-brand'
  const whale = image(DSH_BLACK_WHALE, '', cls('labBrandWhale'))
  whale.setAttribute('aria-hidden', 'true')
  const lockup = document.createElement('div')
  const title = document.createElement('strong')
  title.textContent = 'BLACK WHALE LAB'
  const subtitle = document.createElement('span')
  subtitle.textContent = 'XIAOYAO / DSH · 02'
  lockup.append(title, subtitle)
  brand.append(whale, lockup)

  const focusButton = document.createElement('button')
  focusButton.type = 'button'
  focusButton.className = cls('focusButton')
  focusButton.dataset.skinChrome = 'focus-button'
  focusButton.setAttribute('aria-pressed', 'false')
  const focusDot = document.createElement('span')
  focusDot.className = cls('focusDot')
  const focusLabel = document.createElement('span')
  focusLabel.textContent = '专注模式'
  focusButton.append(focusDot, focusLabel)

  const status = document.createElement('div')
  status.className = cls('labStatus')
  status.dataset.skinChrome = 'lab-status'
  const items = ['BLACK WHALE', 'SKIN 02', 'LOCAL ONLY']
  for (const text of items) {
    const item = document.createElement('span')
    item.textContent = text
    status.append(item)
  }

  const toggleFocus = (): void => {
    focus = !focus
    body.toggleAttribute('data-dsh-black-whale-focus', focus)
    focusButton.setAttribute('aria-pressed', String(focus))
    focusLabel.textContent = focus ? '退出专注' : '专注模式'
    paintBackdrop()
  }
  focusButton.addEventListener('click', toggleFocus)

  const favicon = document.createElement('link')
  favicon.rel = 'icon'
  favicon.href = DSH_BLACK_WHALE
  document.head.append(favicon)

  document.title = TITLE
  body.append(brand, focusButton, status)

  const contrastTagged = new Set<HTMLElement>()
  const pendingContrastRoots = new Set<Element>()
  let contrastAuditQueued = false
  let disposed = false
  const auditContrast = (root: Element): void => {
    const candidates: HTMLElement[] = []
    if (root instanceof HTMLElement && root.matches(CONTRAST_CANDIDATES)) candidates.push(root)
    candidates.push(...root.querySelectorAll<HTMLElement>(CONTRAST_CANDIDATES))
    for (const candidate of candidates) {
      guardControlContrast(candidate)
      if (candidate.hasAttribute('data-dsh-black-whale-ink')) contrastTagged.add(candidate)
      else contrastTagged.delete(candidate)
    }
  }
  const scheduleContrastAudit = (root: Element): void => {
    pendingContrastRoots.add(root)
    if (contrastAuditQueued) return
    contrastAuditQueued = true
    queueMicrotask(() => {
      contrastAuditQueued = false
      if (disposed) return
      for (const pending of pendingContrastRoots) auditContrast(pending)
      pendingContrastRoots.clear()
    })
  }
  const contrastObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.target instanceof Element) {
        scheduleContrastAudit(mutation.target)
      }
      for (const node of mutation.addedNodes) {
        if (node instanceof Element) scheduleContrastAudit(node)
      }
    }
  })
  contrastObserver.observe(body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['class', 'style', 'aria-pressed', 'aria-selected'],
  })
  scheduleContrastAudit(body)

  ctx.effect(() => () => {
    disposed = true
    contrastObserver.disconnect()
    for (const element of contrastTagged) element.removeAttribute('data-dsh-black-whale-ink')
    delete body.dataset.dshBlackWhale
    body.removeAttribute('data-dsh-black-whale-focus')
    focusButton.removeEventListener('click', toggleFocus)
    for (const [prop, value] of previous) body.style.setProperty(prop, value)
    brand.remove()
    focusButton.remove()
    status.remove()
    favicon.remove()
    if (document.title === TITLE) document.title = originalTitle
  }, 'ui-skin-black-whale: reversible presentation')
}
