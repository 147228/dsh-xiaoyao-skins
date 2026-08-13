import type { Context } from '@deepseek-ai/cordis'

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

export interface GreatWallSkinConfig {
  bodyAttribute: string
  title: string
  lockup: string
  subtitle: string
  serial: string
  stage: string
  whale: string
  scrim: string
  focusScrim: string
  css: Record<string, string>
}

const cls = (css: Record<string, string>, name: string): string => css[name] ?? ''

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

/** Mark only controls whose foreground disappears on an opaque light fill. */
function guardControlContrast(element: HTMLElement): void {
  const style = getComputedStyle(element)
  const background = rgba(style.backgroundColor)
  const foreground = rgba(style.color)
  const needsInk = background !== undefined
    && foreground !== undefined
    && background[3] >= 0.55
    && brightness(background) >= 0.82
    && brightness(foreground) >= 0.68
  element.toggleAttribute('data-dsh-great-wall-ink', needsInk)
}

/** Mount one reversible Great Wall presentation layer over the real DSH shell. */
export function mountGreatWallSkin(ctx: Context, config: GreatWallSkinConfig): void {
  const body = document.body
  const originalTitle = document.title
  const previous = new Map<string, string>()
  for (const prop of BACKDROP_PROPERTIES) previous.set(prop, body.style.getPropertyValue(prop))

  body.setAttribute('data-dsh-great-wall-skin', '')
  body.setAttribute(config.bodyAttribute, '')
  let focus = false

  const paintBackdrop = (): void => {
    body.style.setProperty('background-image', `${focus ? config.focusScrim : config.scrim}, url(${config.stage})`)
    body.style.setProperty('background-position', 'center right')
    body.style.setProperty('background-size', 'cover')
    body.style.setProperty('background-attachment', 'fixed')
    body.style.setProperty('background-repeat', 'no-repeat')
  }
  paintBackdrop()

  const brand = document.createElement('div')
  brand.className = cls(config.css, 'wallBrand')
  brand.dataset.skinChrome = 'great-wall-brand'
  const whale = image(config.whale, '', cls(config.css, 'wallBrandWhale'))
  whale.setAttribute('aria-hidden', 'true')
  const lockup = document.createElement('div')
  const title = document.createElement('strong')
  title.textContent = config.lockup
  const subtitle = document.createElement('span')
  subtitle.textContent = config.subtitle
  lockup.append(title, subtitle)
  brand.append(whale, lockup)

  const focusButton = document.createElement('button')
  focusButton.type = 'button'
  focusButton.className = cls(config.css, 'modeButton')
  focusButton.dataset.skinChrome = 'focus-button'
  focusButton.setAttribute('aria-pressed', 'false')
  const focusDot = document.createElement('span')
  focusDot.className = cls(config.css, 'modeDot')
  const focusLabel = document.createElement('span')
  focusLabel.textContent = '沉浸模式'
  focusButton.append(focusDot, focusLabel)

  const status = document.createElement('div')
  status.className = cls(config.css, 'wallStatus')
  status.dataset.skinChrome = 'great-wall-status'
  for (const text of [config.serial, 'XIAOYAO × DSH', 'LOCAL ONLY']) {
    const item = document.createElement('span')
    item.textContent = text
    status.append(item)
  }

  const toggleFocus = (): void => {
    focus = !focus
    body.toggleAttribute('data-dsh-great-wall-focus', focus)
    focusButton.setAttribute('aria-pressed', String(focus))
    focusLabel.textContent = focus ? '退出沉浸' : '沉浸模式'
    paintBackdrop()
  }
  focusButton.addEventListener('click', toggleFocus)

  const favicon = document.createElement('link')
  favicon.rel = 'icon'
  favicon.href = config.whale
  document.head.append(favicon)

  document.title = config.title
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
      if (candidate.hasAttribute('data-dsh-great-wall-ink')) contrastTagged.add(candidate)
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
      if (mutation.type === 'attributes' && mutation.target instanceof Element) scheduleContrastAudit(mutation.target)
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
    for (const element of contrastTagged) element.removeAttribute('data-dsh-great-wall-ink')
    body.removeAttribute(config.bodyAttribute)
    body.removeAttribute('data-dsh-great-wall-skin')
    body.removeAttribute('data-dsh-great-wall-focus')
    focusButton.removeEventListener('click', toggleFocus)
    for (const [prop, value] of previous) body.style.setProperty(prop, value)
    brand.remove()
    focusButton.remove()
    status.remove()
    favicon.remove()
    if (document.title === config.title) document.title = originalTitle
  }, `great-wall-skin: ${config.serial}`)
}
