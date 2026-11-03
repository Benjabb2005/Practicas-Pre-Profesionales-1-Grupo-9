const { errorValidacion } = require('./errors');

function validarContactoObligatorio(cliente) {
    const campos = {};
    if (!String(cliente?.dni ?? '').trim()) campos.dni = 'El DNI es obligatorio.';
    if (!/\d/.test(String(cliente?.telefono ?? ''))) campos.telefono = 'El teléfono es obligatorio y debe contener números.';
    if (Object.keys(campos).length) throw errorValidacion(campos);
}
module.exports = { validarContactoObligatorio };
