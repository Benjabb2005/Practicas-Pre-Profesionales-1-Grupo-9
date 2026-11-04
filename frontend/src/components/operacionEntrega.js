// getRandomValues también funciona por HTTP en la red local, a diferencia de
// randomUUID. Conservamos UUID v4 para la idempotencia que valida el servidor.
export function crearIdOperacion() {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0'))
  return [hex.slice(0, 4), hex.slice(4, 6), hex.slice(6, 8), hex.slice(8, 10), hex.slice(10)].map(parte => parte.join('')).join('-')
}
