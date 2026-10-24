import html2canvas from 'html2canvas'

const EVITE_BACKGROUND = '/images/wedding-evite-background.png'

async function waitForImage(src) {
  const image = new Image()
  image.src = src
  if (typeof image.decode === 'function') {
    await image.decode()
    return
  }

  await new Promise((resolve, reject) => {
    image.onload = resolve
    image.onerror = () => reject(new Error(`Could not load image: ${src}`))
  })
}

async function createEviteFile(element, baseName) {
  await Promise.all([
    document.fonts?.ready,
    waitForImage(new URL(EVITE_BACKGROUND, window.location.origin).href)
  ])

  const canvas = await html2canvas(element, {
    allowTaint: false,
    backgroundColor: null,
    logging: false,
    scale: 3,
    useCORS: true
  })
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) {
    throw new Error('The browser could not encode the e-vite as a PNG.')
  }

  return new File([blob], `${createSafeFileName(baseName)}.png`, { type: 'image/png' })
}

function createSafeFileName(baseName) {
  const safeName = baseName
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')

  return safeName || 'Dingani-Gloria-Wedding-Guest'
}

function downloadFile(file) {
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function downloadEvite(element, baseName) {
  const file = await createEviteFile(element, baseName)
  downloadFile(file)
}
