import type { Context } from '@deepseek-ai/cordis'
import css from './xiaoyao.module.css'
import { XIAOYAO_EMBLEM, XIAOYAO_GUIDE, XIAOYAO_STAGE } from './art.generated.ts'

const SKIN_TITLE = '夕小瑶 · DeepSeek Harness'
const BACKDROP_PROPERTIES = [
  'background-image',
  'background-position',
  'background-size',
  'background-attachment',
  'background-repeat',
  '--dsh-xiaoyao-guide',
] as const

const cls = (name: keyof typeof css): string => css[name] ?? ''

function image(src: string, alt: string, className: string): HTMLImageElement {
  const img = document.createElement('img')
  img.src = src
  img.alt = alt
  img.className = className
  return img
}

/** Apply the Xiaoyao skin and return every write through Cordis' effect lifecycle. */
export function apply(ctx: Context): void {
  const body = document.body
  const originalTitle = document.title
  const previous = new Map<string, string>()
  for (const prop of BACKDROP_PROPERTIES) previous.set(prop, body.style.getPropertyValue(prop))

  body.dataset.dshXiaoyao = ''
  body.style.setProperty('--dsh-xiaoyao-guide', `url(${XIAOYAO_GUIDE})`)

  const setBackdrop = (): void => {
    const dark = body.dataset.dsDarkTheme !== undefined
    const scrim = dark
      ? 'linear-gradient(90deg, rgba(2,7,22,.68) 0%, rgba(3,11,34,.28) 36%, rgba(2,8,24,.10) 68%, rgba(3,10,30,.20) 100%)'
      : 'linear-gradient(90deg, rgba(2,9,28,.56) 0%, rgba(5,19,49,.20) 40%, rgba(5,16,42,.06) 72%, rgba(3,12,34,.16) 100%)'
    body.style.setProperty('background-image', `${scrim}, url(${XIAOYAO_STAGE})`)
    body.style.setProperty('background-position', 'center')
    body.style.setProperty('background-size', 'cover')
    body.style.setProperty('background-attachment', 'fixed')
    body.style.setProperty('background-repeat', 'no-repeat')
  }
  setBackdrop()

  const observer = new MutationObserver(setBackdrop)
  observer.observe(body, { attributes: true, attributeFilter: ['data-ds-dark-theme'] })

  // The background supplies the right-hand IP figure. A separate transparent
  // character layer balances the stage on the left while remaining completely
  // pointer-transparent, so all native DSH controls stay interactive.
  const stageCharacter = image(XIAOYAO_GUIDE, '', cls('stageCharacter'))
  stageCharacter.dataset.skinChrome = 'stage-character'
  stageCharacter.setAttribute('aria-hidden', 'true')

  const brand = document.createElement('div')
  brand.className = cls('brandbar')
  brand.dataset.skinChrome = 'brandbar'
  const mark = image(XIAOYAO_EMBLEM, '', cls('brandMark'))
  mark.setAttribute('aria-hidden', 'true')
  const words = document.createElement('div')
  const name = document.createElement('strong')
  name.textContent = '夕小瑶 · 探索之境'
  const sub = document.createElement('span')
  sub.textContent = 'DeepSeek Harness Skin'
  words.append(name, sub)
  const live = document.createElement('span')
  live.className = cls('livePill')
  live.textContent = 'OCEAN ONLINE'
  brand.append(mark, words, live)

  const launcher = document.createElement('button')
  launcher.type = 'button'
  launcher.className = cls('guideLauncher')
  launcher.dataset.skinChrome = 'guide-launcher'
  launcher.setAttribute('aria-label', '打开夕小瑶皮肤说明')
  launcher.setAttribute('aria-expanded', 'false')
  launcher.append(image(XIAOYAO_EMBLEM, '', cls('launcherMark')))

  const guide = document.createElement('aside')
  guide.className = `${cls('guideCard')} ${cls('guideCardHidden')}`
  guide.dataset.skinChrome = 'guide-card'
  guide.setAttribute('aria-hidden', 'true')
  const close = document.createElement('button')
  close.type = 'button'
  close.className = cls('guideClose')
  close.setAttribute('aria-label', '关闭')
  close.textContent = '×'
  const copy = document.createElement('div')
  copy.className = cls('guideCopy')
  const eyebrow = document.createElement('span')
  eyebrow.textContent = 'XIAOYAO GUIDE'
  const heading = document.createElement('strong')
  heading.textContent = '今天想探索什么？'
  const hint = document.createElement('p')
  hint.textContent = '皮肤只改变外观，不会读取会话，也不会发起模型请求。'
  copy.append(eyebrow, heading, hint)
  guide.append(close, image(XIAOYAO_GUIDE, '夕小瑶粉发猫娘形象', cls('guideArt')), copy)

  const setGuide = (open: boolean): void => {
    launcher.setAttribute('aria-expanded', String(open))
    guide.setAttribute('aria-hidden', String(!open))
    guide.classList.toggle(cls('guideCardHidden'), !open)
  }
  const toggle = (): void => setGuide(launcher.getAttribute('aria-expanded') !== 'true')
  const dismiss = (): void => setGuide(false)
  launcher.addEventListener('click', toggle)
  close.addEventListener('click', dismiss)

  const favicon = document.createElement('link')
  favicon.rel = 'icon'
  favicon.href = XIAOYAO_EMBLEM
  document.head.append(favicon)

  document.title = SKIN_TITLE
  body.append(stageCharacter, brand, launcher, guide)

  ctx.effect(() => () => {
    delete body.dataset.dshXiaoyao
    observer.disconnect()
    launcher.removeEventListener('click', toggle)
    close.removeEventListener('click', dismiss)
    for (const [prop, value] of previous) body.style.setProperty(prop, value)
    brand.remove()
    stageCharacter.remove()
    launcher.remove()
    guide.remove()
    favicon.remove()
    if (document.title === SKIN_TITLE) document.title = originalTitle
  }, 'ui-skin-xiaoyao: reversible presentation')
}
