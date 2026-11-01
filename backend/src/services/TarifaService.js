const { normalizarImporte } = require('../lib/importes');
const { errorValidacion, conflicto } = require('../lib/errors');
const { normalizarDireccion } = require('./NormalizadorDireccion');
const { validarDireccion } = require('./ValidadorDireccion');

function camposConErrores(problemas) {
    return problemas.reduce((campos, problema) => {
        const campo = problema.campo || 'general';
        campos[campo] = campos[campo]
            ? `${campos[campo]} ${problema.mensaje}`
            : problema.mensaje;
        return campos;
    }, {});
}

function createTarifaService({ repositorio, geocodeAdapter }) {
    return {
        obtener: () => repositorio.obtener(),
        guardar: (precio, usuarioId) => repositorio.guardar(normalizarImporte(precio, 'precio_km'), usuarioId),
        async guardarSucursal(datos, usuarioId) {
            const direccion = normalizarDireccion(datos);
            const { problemas } = validarDireccion(direccion);
            const errores = problemas.filter((problema) => problema.gravedad === 'ERROR');
            if (errores.length) throw errorValidacion(camposConErrores(errores));

            const resultado = await geocodeAdapter.geocodificar(direccion);
            if (resultado.resultado === 'ZERO_RESULTS' || resultado.resultado === 'ERROR') {
                throw conflicto(resultado.motivo || 'Georef no pudo ubicar la sucursal.');
            }

            const candidato = resultado.candidatos?.[0];
            if (
                !candidato
                || typeof candidato.direccion !== 'string'
                || !candidato.direccion.trim()
                || !Number.isFinite(candidato.latitud)
                || !Number.isFinite(candidato.longitud)
            ) {
                throw conflicto(resultado.motivo || 'Georef no devolvió una ubicación válida para la sucursal.');
            }

            return repositorio.guardarSucursal({
                calle: direccion.calle,
                altura: direccion.altura,
                localidad: direccion.localidad,
                provincia: direccion.provincia,
                direccion: candidato.direccion,
                latitud: candidato.latitud,
                longitud: candidato.longitud,
            }, usuarioId);
        },
    };
}
module.exports = { createTarifaService };
