import { coordenadasDeMapa } from './mapa.js'

// Únicamente las teselas de esta vista, al pulsar descargar. El navegador
// conserva caché y Referer; no se precargan zonas ni se descarga para uso offline.
export function vistaMapa(latitud, longitud) {
  const punto = coordenadasDeMapa(latitud, longitud)
  if (!punto) return null
  const zoom = 15, escala = 2 ** zoom
  const lat = Math.max(-85.05112878, Math.min(85.05112878, punto.lat))
  const seno = Math.sin(lat * Math.PI / 180)
  const x = (punto.lon + 180) / 360 * escala * 256
  const y = (0.5 - Math.log((1 + seno) / (1 - seno)) / (4 * Math.PI)) * escala * 256
  const ancho = 640, alto = 400, izquierda = x - ancho / 2, arriba = y - alto / 2
  const teselas = []
  for (let ty = Math.floor(arriba / 256); ty <= Math.floor((arriba + alto - 1) / 256); ty++) {
    for (let tx = Math.floor(izquierda / 256); tx <= Math.floor((izquierda + ancho - 1) / 256); tx++) {
      if (ty < 0 || ty >= escala) continue
      teselas.push({ url: `https://tile.openstreetmap.org/${zoom}/${((tx % escala) + escala) % escala}/${ty}.png`, x: tx * 256 - izquierda, y: ty * 256 - arriba })
    }
  }
  return { ancho, alto, teselas }
}

function cargarImagen(url) {
  return new Promise((resolve, reject) => {
    const imagen = new Image()
    const terminar = error => {
      clearTimeout(timeout)
      imagen.onload = null; imagen.onerror = null
      if (error) { imagen.src = ''; reject(error) } else resolve(imagen)
    }
    const timeout = setTimeout(() => terminar(new Error('El mapa demoró demasiado.')), 8000)
    imagen.crossOrigin = 'anonymous'
    imagen.onload = () => terminar()
    imagen.onerror = () => terminar(new Error('No se pudo obtener la imagen del mapa.'))
    imagen.src = url
  })
}

export async function imagenMapa(pedido) {
  const vista = vistaMapa(pedido.latitud, pedido.longitud)
  if (!vista) return null
  const imagenes = await Promise.all(vista.teselas.map(t => cargarImagen(t.url)))
  const canvas = document.createElement('canvas')
  canvas.width = vista.ancho; canvas.height = vista.alto
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#eef1f5'; ctx.fillRect(0, 0, vista.ancho, vista.alto)
  vista.teselas.forEach((t, i) => ctx.drawImage(imagenes[i], t.x, t.y, 256, 256))
  const x = vista.ancho / 2, y = vista.alto / 2
  ctx.fillStyle = '#144dc7'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 12, y - 23)
  ctx.arc(x, y - 25, 12, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke()
  ctx.font = '12px sans-serif'
  const atribucion = '© OpenStreetMap contributors · openstreetmap.org/copyright'
  const anchoAtribucion = ctx.measureText(atribucion).width + 12
  ctx.fillStyle = '#ffffff'; ctx.fillRect(vista.ancho - anchoAtribucion, vista.alto - 22, anchoAtribucion, 22)
  ctx.fillStyle = '#222222'; ctx.fillText(atribucion, vista.ancho - anchoAtribucion + 6, vista.alto - 7)
  return canvas.toDataURL('image/png')
}
