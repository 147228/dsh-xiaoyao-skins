import type { Context } from '@deepseek-ai/cordis'
import css from './sky-lab.module.css'
import { SKY_DUO, SKY_EMBLEM, SKY_STAGE } from './art.generated.ts'

const TITLE = '蓝粉双子 · 晴空研究所'
const PROPS = ['background-image','background-position','background-size','background-attachment','background-repeat'] as const
const cls = (name: keyof typeof css): string => css[name] ?? ''

function img(src: string, alt: string, className: string): HTMLImageElement {
  const node = document.createElement('img'); node.src = src; node.alt = alt; node.className = className; return node
}

export function apply(ctx: Context): void {
  const body = document.body
  const previousTitle = document.title
  const previous = new Map(PROPS.map(prop => [prop, body.style.getPropertyValue(prop)]))
  body.dataset.dshSkyLab = ''

  const paint = (): void => {
    const dark = body.dataset.dsDarkTheme !== undefined
    const scrim = dark
      ? 'linear-gradient(90deg,rgba(4,16,45,.18),rgba(10,36,82,.06) 48%,rgba(26,48,94,0))'
      : 'linear-gradient(90deg,rgba(250,253,255,.12),rgba(238,247,255,.03) 48%,rgba(235,244,255,0))'
    body.style.setProperty('background-image', `${scrim},url(${SKY_STAGE})`)
    body.style.setProperty('background-position','center right')
    body.style.setProperty('background-size','cover')
    body.style.setProperty('background-attachment','fixed')
    body.style.setProperty('background-repeat','no-repeat')
  }
  paint()
  const observer = new MutationObserver(paint)
  observer.observe(body,{attributes:true,attributeFilter:['data-ds-dark-theme']})

  const brand = document.createElement('div'); brand.className = cls('brand'); brand.dataset.skinChrome = 'sky-brand'
  brand.append(img(SKY_EMBLEM,'',cls('brandIcon')))
  const words = document.createElement('div'); words.innerHTML = '<strong>蓝粉双子 · 晴空研究所</strong><span>CREATIVE SYSTEM ONLINE</span>'
  brand.append(words)

  const launcher = document.createElement('button'); launcher.type='button'; launcher.className=cls('launcher'); launcher.dataset.skinChrome='sky-launcher'; launcher.setAttribute('aria-expanded','false'); launcher.setAttribute('aria-label','打开双子研究所向导'); launcher.append(img(SKY_EMBLEM,'',cls('launcherIcon')))
  const card = document.createElement('aside'); card.className=`${cls('card')} ${cls('cardHidden')}`; card.dataset.skinChrome='sky-card'; card.setAttribute('aria-hidden','true')
  const close=document.createElement('button'); close.type='button'; close.className=cls('close'); close.textContent='×'; close.setAttribute('aria-label','关闭')
  const copy=document.createElement('div'); copy.className=cls('copy'); copy.innerHTML='<span>TWIN SKY LAB</span><strong>两位搭档，双路协作</strong><p>蓝鲸女仆处理工具与代码，小瑶负责选题与内容。</p>'
  card.append(close,copy,img(SKY_DUO,'蓝鲸女仆与夕小瑶双人形象',cls('duo')))
  const show=(open:boolean):void=>{ launcher.setAttribute('aria-expanded',String(open)); card.setAttribute('aria-hidden',String(!open)); card.classList.toggle(cls('cardHidden'),!open) }
  const toggle=():void=>show(launcher.getAttribute('aria-expanded')!=='true')
  const dismiss=():void=>show(false)
  launcher.addEventListener('click',toggle); close.addEventListener('click',dismiss)

  const favicon=document.createElement('link'); favicon.rel='icon'; favicon.href=SKY_EMBLEM; document.head.append(favicon)
  document.title=TITLE; body.append(brand,launcher,card)

  ctx.effect(() => () => {
    delete body.dataset.dshSkyLab; observer.disconnect(); launcher.removeEventListener('click',toggle); close.removeEventListener('click',dismiss)
    for (const [prop,value] of previous) body.style.setProperty(prop,value)
    brand.remove(); launcher.remove(); card.remove(); favicon.remove()
    if (document.title===TITLE) document.title=previousTitle
  },'ui-skin-sky-lab: reversible presentation')
}
