import { api } from './client.js'
export async function obtenerTarifa() { return (await api.get('/tarifas')).data.tarifa }
export async function guardarTarifa(precio_km) { return (await api.put('/tarifas', { precio_km })).data.tarifa }
