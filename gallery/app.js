const grid = document.querySelector('#skin-grid')
const search = document.querySelector('#search')
const toast = document.querySelector('#toast')
const catalog = await fetch('catalog.json').then((response) => {
  if (!response.ok) throw new Error(`catalog ${response.status}`)
  return response.json()
})

function escape(value) {
  const node = document.createElement('span')
  node.textContent = String(value)
  return node.innerHTML
}

function card(skin, index) {
  const tags = skin.tags.map((tag) => `<span>${escape(tag)}</span>`).join('')
  const featured = index === 0 ? ' card-featured' : ''
  return `<article id="skin-${escape(skin.id)}" class="card${featured}" style="--accent:${escape(skin.accent)};--delay:${index * 45}ms">
    <div class="preview"><img src="${escape(skin.preview)}" alt="${escape(skin.name)}接入真实 DeepSeek Harness Web profile 后的效果" loading="${index < 3 ? 'eager' : 'lazy'}"><span class="verified">REAL PROFILE</span></div>
    <div class="card-body"><div class="meta"><span>NO. ${String(index + 1).padStart(2, '0')}</span><span>v${escape(skin.version)}</span></div>
    <h3>${escape(skin.name)}</h3><p class="tagline">${escape(skin.tagline)}</p><p class="description">${escape(skin.description)}</p>
    <div class="tags">${tags}</div><div class="install"><code>xiaoyao-skin use ${escape(skin.slug)}</code><button data-copy="${escape(skin.install)}">复制安装命令</button></div></div>
  </article>`
}

function render(query = '') {
  const normalized = query.trim().toLowerCase()
  const skins = catalog.skins.filter((skin) => [skin.name, skin.nameEn, skin.author, skin.tagline, ...skin.tags].join(' ').toLowerCase().includes(normalized))
  grid.innerHTML = skins.map(card).join('') || '<p class="empty">没有匹配的皮肤。</p>'
}

async function copy(text) {
  await navigator.clipboard.writeText(text)
  toast.textContent = '命令已复制'
  toast.classList.add('show')
  setTimeout(() => toast.classList.remove('show'), 1300)
}

function onCopyFailure() {
  toast.textContent = '复制失败，请手动选择命令'
  toast.classList.add('show')
  setTimeout(() => toast.classList.remove('show'), 1800)
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-copy]')
  if (button) copy(button.dataset.copy).catch(onCopyFailure)
})
search.addEventListener('input', () => render(search.value))
render()
