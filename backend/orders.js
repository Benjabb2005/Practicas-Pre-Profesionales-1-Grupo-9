const express = require("express");
const { createHash, randomBytes } = require("node:crypto");
const { createGeoref, validAddress } = require("./georef");

function addressVersion(order) {
    return createHash("sha256").update(JSON.stringify([order.addressRevision === null ? null : Number(order.addressRevision || 1), order.direccionOriginal || "", order.calle, order.altura, order.pisoDepto || "", order.localidad, order.provincia, order.codigoPostal])).digest("hex");
}

function validateLocation(input) {
    if (!object(input) || Object.keys(input).some((key) => !["version", "lat", "lng", "observation"].includes(key)) || !/^[a-f0-9]{64}$/.test(input.version || "") || !Number.isFinite(input.lat) || Math.abs(input.lat) > 90 || !Number.isFinite(input.lng) || Math.abs(input.lng) > 180 || typeof input.observation !== "string" || !input.observation.trim() || input.observation.length > 1000) throw issue(422, "INVALID_CONFIRMATION", "Revisá las coordenadas y agregá una observación (máximo 1000 caracteres).");
    return { ...input, lat: Number(input.lat.toFixed(8)), lng: Number(input.lng.toFixed(8)), observation: input.observation.trim() };
}

async function insertConfirmation(connection, order, input, user) {
    await connection.execute("INSERT INTO historial_geolocalizacion (pedido_id, direccion_enviada, resultado, coordenadas_lat, coordenadas_lng, proveedor, operador, confirmado_por_operador) VALUES (?, ?, 'APPROXIMATE', ?, ?, 'manual', ?, 1)", [order.id, JSON.stringify({ version: input.version, address: { direccionOriginal: order.direccionOriginal, calle: order.calle, altura: order.altura, pisoDepto: order.pisoDepto, localidad: order.localidad, provincia: order.provincia, codigoPostal: order.codigoPostal }, observation: input.observation }), input.lat, input.lng, `usuario:${user.id}`]);
}

function currentConfirmation(order, row) {
    if (!row || order.addressRevision === null || !validAddress(order)) return null;
    if ([row.coordenadas_lat, row.coordenadas_lng].some((value) => value === null || value === undefined || !Number.isFinite(Number(value)))) return null;
    try {
        const review = JSON.parse(row.direccion_enviada);
        if (review.version !== addressVersion(order)) return null;
        return { version: review.version, lat: Number(row.coordenadas_lat), lng: Number(row.coordenadas_lng), observation: review.observation, source: row.proveedor, user: row.operador, date: row.created_at };
    } catch { return null; }
}

function issue(status, code, message, fields = {}) {
    const error = new Error(message);
    Object.assign(error, { status, code, fields });
    return error;
}

function object(value) { return value && typeof value === "object" && !Array.isArray(value); }

function validateOrder(body) {
    const fields = {};
    if (!object(body) || !object(body.cliente) || !object(body.direccion)) {
        throw issue(400, "INVALID_ORDER", "La solicitud no tiene el formato de un pedido.");
    }
    const text = (value, key, max, required = true) => {
        if ((value === undefined || value === "") && !required) return "";
        if (typeof value !== "string" || !value.trim() || value.trim().length > max) { fields[key] = `Completá este campo (máximo ${max} caracteres).`; return ""; }
        return value.trim();
    };
    const cliente = {
        nombre: text(body.cliente.nombre, "nombre", 100), apellido: text(body.cliente.apellido, "apellido", 100),
        dni: text(body.cliente.dni, "dni", 20), telefono: text(body.cliente.telefono, "telefono", 50),
        email: text(body.cliente.email, "email", 150).toLowerCase(),
    };
    if (cliente.nombre.length + cliente.apellido.length + 1 > 150) fields.nombre = "Nombre y apellido no pueden superar 150 caracteres.";
    if (!/^\d{7,8}$/.test(cliente.dni)) fields.dni = "Ingresá un DNI de 7 u 8 dígitos, sin puntos.";
    if (!/^\+?[\d\s().-]+$/.test(cliente.telefono) || cliente.telefono.replace(/\D/g, "").length < 7) fields.telefono = "Ingresá un teléfono válido.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cliente.email)) fields.email = "Ingresá un email válido.";
    const direccion = {
        direccionOriginal: text(body.direccion.direccionOriginal, "direccionOriginal", 1000, false),
        calle: text(body.direccion.calle, "calle", 150), altura: text(body.direccion.altura, "altura", 20),
        pisoDepto: text(body.direccion.pisoDepto, "pisoDepto", 100, false),
        localidad: text(body.direccion.localidad, "localidad", 100), provincia: text(body.direccion.provincia, "provincia", 100),
        codigoPostal: text(body.direccion.codigoPostal, "codigoPostal", 10),
    };
    if (!/^\d+$/.test(direccion.altura) || Number(direccion.altura) <= 0 || !Number.isSafeInteger(Number(direccion.altura))) {
        fields.altura = "Ingresá una altura entera positiva; cero y S/N requieren corrección.";
    }
    const observaciones = text(body.observaciones, "observaciones", 2000, false);
    if (typeof body.direccion.direccionOriginal === "string" && body.direccion.direccionOriginal.length <= 1000) {
        direccion.direccionOriginal = body.direccion.direccionOriginal;
    } else if (body.direccion.direccionOriginal !== undefined) fields.direccionOriginal = "La dirección original no puede superar 1000 caracteres.";
    const clienteId = body.clienteId;
    if (clienteId !== undefined && (!Number.isSafeInteger(clienteId) || clienteId <= 0)) fields.clienteId = "Seleccioná un cliente válido.";
    const known = ["cliente", "direccion", "observaciones", "clienteId", "ubicacion"];
    if (Object.keys(body).some((key) => !known.includes(key)) ||
        Object.keys(body.cliente).some((key) => !Object.hasOwn(cliente, key)) ||
        Object.keys(body.direccion).some((key) => !Object.hasOwn(direccion, key))) {
        throw issue(400, "UNKNOWN_FIELDS", "La solicitud contiene campos no admitidos.");
    }
    if (Object.keys(fields).length) throw issue(422, "INVALID_ORDER", "Corregí los campos indicados antes de guardar.", fields);
    const ubicacion = body.ubicacion === undefined ? undefined : validateLocation(body.ubicacion);
    if (ubicacion && ubicacion.version !== addressVersion({ ...direccion, addressRevision: 1 })) throw issue(409, "ADDRESS_CHANGED", "La dirección cambió después de revisar el mapa. Volvé a confirmar.");
    return { cliente, direccion, observaciones, ...(clienteId ? { clienteId } : {}), ...(ubicacion ? { ubicacion } : {}) };
}

function identity(field, value) {
    const text = String(value || "").trim();
    return field === "email" ? text.toLowerCase() : text.replace(/\D/g, "");
}

function createOrderStore(pool) {
    const select = `SELECT p.id, CONCAT('PED-', p.id) AS codigo, p.estado, p.created_at AS fechaIngreso, p.observaciones,
        c.id AS clienteId, c.nombre, c.apellido, c.dni, c.telefono, c.email,
        d.direccion_original AS direccionOriginal, d.calle, d.altura, d.piso_depto AS pisoDepto,
        d.localidad, d.provincia, d.codigo_postal AS codigoPostal, d.id AS addressId
        FROM pedidos p JOIN clientes c ON c.id = p.cliente_id LEFT JOIN direcciones d ON d.id = p.direccion_id`;
    async function detail(id, connection = pool) {
        const [rows] = await connection.execute(`${select} WHERE p.id = ?`, [id]);
        if (!rows[0]) return null;
        // Permite conservar consulta/carga en bases 002 mientras se aprueba la 003.
        const [addresses] = await connection.execute("SELECT * FROM direcciones WHERE id = ?", [rows[0].addressId]);
        rows[0].addressRevision = addresses[0]?.revision ?? null;
        const [reviews] = await connection.execute("SELECT direccion_enviada, coordenadas_lat, coordenadas_lng, proveedor, operador, created_at FROM historial_geolocalizacion WHERE pedido_id = ? AND confirmado_por_operador = 1 ORDER BY id DESC LIMIT 1", [id]);
        return { ...rows[0], version: addressVersion(rows[0]), confirmation: currentConfirmation(rows[0], reviews[0]) };
    }
    async function replay(connection, key, hash) {
        const [rows] = await connection.execute("SELECT id, hash_creacion FROM pedidos WHERE clave_creacion = ?", [key]);
        if (!rows.length) return null;
        if (rows[0].hash_creacion !== hash) throw issue(409, "IDEMPOTENCY_CONFLICT", "Este envío ya se guardó con otros datos. Revisá el tablero.");
        return { pedido: await detail(rows[0].id, connection), replayed: true };
    }
    return {
        async list({ estado, fechaDesde, fechaHasta, page, pageSize }) {
            const where = [], values = [];
            if (estado) { where.push("p.estado = ?"); values.push(estado); }
            // El calendario operativo usa Buenos Aires (UTC-3); las marcas se consultan en UTC.
            if (fechaDesde) { where.push("p.created_at >= ?"); values.push(`${fechaDesde} 03:00:00`); }
            if (fechaHasta) { where.push("p.created_at < DATE_ADD(?, INTERVAL 1 DAY)"); values.push(`${fechaHasta} 03:00:00`); }
            const filter = where.length ? ` WHERE ${where.join(" AND ")}` : "";
            const [counts] = await pool.execute(`SELECT COUNT(*) AS total FROM pedidos p${filter}`, values);
            const [rows] = await pool.query(`${select}${filter} ORDER BY p.created_at DESC, p.id DESC LIMIT ? OFFSET ?`, [...values, pageSize, (page - 1) * pageSize]);
            return { data: rows, pagination: { page, pageSize, total: counts[0].total } };
        },
        detail,
        async recordGeocode(order, result, user) {
            await pool.execute("INSERT INTO historial_geolocalizacion (pedido_id, direccion_enviada, resultado, proveedor, operador, confirmado_por_operador) VALUES (?, ?, ?, 'georef', ?, 0)", [order.id, JSON.stringify({ version: order.version, address: { calle: order.calle, altura: order.altura, localidad: order.localidad, provincia: order.provincia }, result }), result.status === "zero_results" ? "ZERO_RESULTS" : result.status === "error" ? "ERROR" : "APPROXIMATE", `usuario:${user.id}`]);
        },
        async confirm(id, input, user) {
            const connection = await pool.getConnection();
            try {
                await connection.beginTransaction();
                const [rows] = await connection.execute(`${select} WHERE p.id = ? FOR UPDATE`, [id]);
                const order = rows[0];
                if (!order) throw issue(404, "ORDER_NOT_FOUND", "El pedido no existe.");
                const [addresses] = await connection.execute("SELECT * FROM direcciones WHERE id = ? FOR UPDATE", [order.addressId]);
                order.addressRevision = addresses[0]?.revision ?? null;
                if (order.addressRevision === null) throw issue(503, "REVISION_UNAVAILABLE", "La confirmación requiere aplicar la migración 003 de revisión de dirección.");
                if (!validAddress(order)) throw issue(422, "INCOMPLETE_ADDRESS", "La dirección está incompleta.");
                if (input.version !== addressVersion(order)) throw issue(409, "ADDRESS_CHANGED", "La dirección cambió. Volvé a abrir el detalle y revisá la ubicación.");
                if (!["pendiente_validacion", "requiere_revision", "direccion_validada", "en_preparacion"].includes(order.estado)) throw issue(409, "ORDER_STATE", "Este pedido no admite revisión de ubicación en su estado actual.");
                const previous = (await detail(id, connection)).confirmation;
                if (previous && previous.lat === input.lat && previous.lng === input.lng && previous.observation === input.observation && previous.user === `usuario:${user.id}`) {
                    await connection.commit();
                    return await detail(id);
                }
                await insertConfirmation(connection, order, input, user);
                // La confirmación no adelanta transiciones de despacho todavía pendientes de T07.
                await connection.commit();
                return await detail(id);
            } catch (error) { await connection.rollback(); throw error; }
            finally { connection.release(); }
        },
        async frequent(q) {
            const escaped = q.replace(/[!%_]/g, (c) => `!${c}`);
            const digits = /^[+\d\s().-]+$/.test(q) ? identity("telefono", q) : "";
            const [rows] = await pool.execute(
                "SELECT id, nombre, apellido, dni, telefono, email FROM clientes WHERE dni LIKE ? ESCAPE '!' OR email LIKE ? ESCAPE '!' OR telefono LIKE ? ESCAPE '!' OR (? <> '' AND (REGEXP_REPLACE(COALESCE(dni, ''), '[^0-9]', '') LIKE ? OR REGEXP_REPLACE(COALESCE(telefono, ''), '[^0-9]', '') LIKE ?)) ORDER BY CASE WHEN CAST(LOWER(TRIM(email)) AS BINARY) = CAST(? AS BINARY) OR (? <> '' AND (REGEXP_REPLACE(COALESCE(dni, ''), '[^0-9]', '') = ? OR REGEXP_REPLACE(COALESCE(telefono, ''), '[^0-9]', '') = ?)) THEN 0 ELSE 1 END, id LIMIT 20",
                [`%${escaped}%`, `%${escaped}%`, `%${escaped}%`, digits, `%${digits}%`, `%${digits}%`, identity("email", q), digits, digits, digits],
            );
            return rows;
        },
        async create(input, key, user) {
            const hash = createHash("sha256").update(JSON.stringify(input)).digest("hex");
            const connection = await pool.getConnection();
            let clientLock;
            try {
                if (!input.clienteId) {
                    // Serializa altas entre procesos para no duplicar identidad por dos envíos simultáneos.
                    const [locks] = await connection.query("SELECT CONCAT('mandatodo:clientes:', LEFT(SHA2(DATABASE(), 256), 32)) AS name, GET_LOCK(CONCAT('mandatodo:clientes:', LEFT(SHA2(DATABASE(), 256), 32)), 5) AS acquired");
                    if (locks[0].acquired !== 1) throw issue(503, "CLIENT_BUSY", "Hay otra carga de cliente en curso. Volvé a intentar.");
                    clientLock = locks[0].name;
                }
                await connection.beginTransaction();
                const previous = await replay(connection, key, hash);
                if (previous) { await connection.commit(); return previous; }
                let clienteId = input.clienteId;
                if (clienteId) {
                    const [rows] = await connection.execute("SELECT nombre, apellido, dni, telefono, email FROM clientes WHERE id = ? FOR UPDATE", [clienteId]);
                    if (!rows.length) throw issue(404, "CLIENT_NOT_FOUND", "El cliente seleccionado no existe.");
                    if (Object.entries(input.cliente).some(([field, value]) => ["dni", "telefono", "email"].includes(field)
                        ? identity(field, rows[0][field]) !== identity(field, value)
                        : String(rows[0][field] || "").trim().toLowerCase() !== value.toLowerCase())) {
                        throw issue(409, "CLIENT_DATA_CONFLICT", "Los datos difieren del cliente seleccionado. Revisá o cargá un cliente diferente; no se sobrescribieron datos.");
                    }
                } else {
                    const [candidates] = await connection.execute("SELECT dni, email, telefono FROM clientes WHERE REGEXP_REPLACE(COALESCE(dni, ''), '[^0-9]', '') = ? OR BINARY LOWER(TRIM(email)) = BINARY ? OR REGEXP_REPLACE(COALESCE(telefono, ''), '[^0-9]', '') = ? LIMIT 20", [input.cliente.dni, input.cliente.email, identity("telefono", input.cliente.telefono)]);
                    if (candidates.length) {
                        const fields = {};
                        for (const field of ["dni", "email", "telefono"]) {
                            if (candidates.some((c) => identity(field, c[field]) === identity(field, input.cliente[field]))) {
                                fields[field] = "Este dato ya pertenece a un cliente registrado.";
                            }
                        }
                        throw issue(409, "CLIENT_ALREADY_EXISTS", "Ya existe un cliente con ese DNI, email o teléfono. Seleccionalo en Clientes frecuentes; no se creó otra persona.", fields);
                    }
                    const c = input.cliente;
                    const [created] = await connection.execute("INSERT INTO clientes (codigo, nombre, apellido, dni, telefono, email) VALUES (?, ?, ?, ?, ?, ?)",
                        [`CLI-${randomBytes(8).toString("hex")}`, c.nombre, c.apellido, c.dni, c.telefono, c.email]);
                    clienteId = created.insertId;
                }
                const d = input.direccion;
                const [address] = await connection.execute("INSERT INTO direcciones (direccion_original, calle, altura, piso_depto, localidad, provincia, codigo_postal, normalizada) VALUES (?, ?, ?, ?, ?, ?, ?, 0)",
                    [d.direccionOriginal, d.calle, d.altura, d.pisoDepto || null, d.localidad, d.provincia, d.codigoPostal]);
                const [order] = await connection.execute("INSERT INTO pedidos (codigo, cliente_id, direccion_id, estado, observaciones, posible_duplicado, clave_creacion, hash_creacion) VALUES (?, ?, ?, 'pendiente_validacion', ?, 0, ?, ?)",
                    [`PED-${randomBytes(8).toString("hex")}`, clienteId, address.insertId, input.observaciones || null, key, hash]);
                await connection.execute("UPDATE pedidos SET codigo = ? WHERE id = ?", [`PED-${order.insertId}`, order.insertId]);
                await connection.execute("INSERT INTO historial_estados (pedido_id, estado_anterior, estado_nuevo, observaciones, usuario) VALUES (?, NULL, 'pendiente_validacion', ?, ?)",
                    [order.insertId, "Carga inicial; ubicación pendiente de confirmación.", `usuario:${user.id}`]);
                let pedido = await detail(order.insertId, connection);
                if (input.ubicacion) {
                    if (pedido.addressRevision === null) throw issue(503, "REVISION_UNAVAILABLE", "La confirmación todavía no está activada en este entorno.");
                    if (input.ubicacion.version !== pedido.version) throw issue(409, "ADDRESS_CHANGED", "La dirección cambió. Volvé a revisar la ubicación.");
                    await insertConfirmation(connection, pedido, input.ubicacion, user);
                    pedido = await detail(order.insertId, connection);
                }
                await connection.commit();
                return { pedido, replayed: false };
            } catch (error) {
                await connection.rollback();
                if (error.code === "ER_DUP_ENTRY") {
                    const previous = await replay(pool, key, hash);
                    if (previous) return previous;
                }
                throw error;
            } finally {
                try { if (clientLock) await connection.execute("SELECT RELEASE_LOCK(?)", [clientLock]); }
                finally { connection.release(); }
            }
        },
    };
}

function createOrders({ store, authenticate, geocode = createGeoref() }) {
    const router = express.Router();
    router.use(authenticate);
    router.use((req, res, next) => {
        if (!["admin", "operador"].includes(req.user.rol)) return next(issue(403, "FORBIDDEN", "No tenés permiso para esta operación."));
        next();
    });
    router.get("/clientes/frecuentes", async (req, res, next) => {
        try {
            if (typeof req.query.q !== "string" || !req.query.q.trim() || req.query.q.length > 150) throw issue(400, "INVALID_SEARCH", "Ingresá un DNI, email o teléfono para buscar.");
            res.json({ data: await store.frequent(req.query.q.trim()) });
        } catch (error) { next(error); }
    });
    router.post("/ubicacion/candidatos", async (req, res, next) => {
        try {
            const input = req.body?.direccion;
            const limits = { direccionOriginal: 1000, calle: 150, altura: 20, pisoDepto: 100, localidad: 100, provincia: 100, codigoPostal: 10 };
            if (!object(input) || Object.keys(req.body).some((key) => key !== "direccion") || Object.keys(input).some((key) => !Object.hasOwn(limits, key))) throw issue(400, "INVALID_ADDRESS", "La dirección no tiene un formato válido.");
            const address = {};
            for (const [key, max] of Object.entries(limits)) {
                const value = input[key] === undefined && ["direccionOriginal", "pisoDepto"].includes(key) ? "" : input[key];
                if (typeof value !== "string" || value.length > max) throw issue(422, "INVALID_ADDRESS", "Completá los campos de dirección antes de consultar.");
                address[key] = key === "direccionOriginal" ? value : value.trim();
            }
            if (!validAddress(address)) throw issue(422, "INCOMPLETE_ADDRESS", "Completá los campos de dirección antes de consultar.");
            res.json({ data: { ...await geocode(address), version: addressVersion({ ...address, addressRevision: 1 }) } });
        } catch (error) { next(error); }
    });
    router.get("/pedidos", async (req, res, next) => {
        try {
            const page = Number(req.query.page || 1), pageSize = Number(req.query.pageSize || 20);
            if (!Number.isSafeInteger(page) || page < 1 || page > 1000000 || !Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 100) throw issue(400, "INVALID_FILTER", "La paginación no es válida.");
            const estado = req.query.estado;
            if (estado && !["pendiente_validacion", "requiere_revision", "direccion_validada", "listo_despacho", "en_camino", "entregado", "fallido", "cancelado", "en_preparacion"].includes(estado)) throw issue(400, "INVALID_FILTER", "El estado no es válido.");
            for (const key of ["fechaDesde", "fechaHasta"]) {
                const value = req.query[key];
                if (value && (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value)) throw issue(400, "INVALID_FILTER", "La fecha no es válida.");
            }
            if (req.query.fechaDesde && req.query.fechaHasta && req.query.fechaDesde > req.query.fechaHasta) throw issue(400, "INVALID_FILTER", "El rango de fechas no es válido.");
            res.json(await store.list({ page, pageSize, estado, fechaDesde: req.query.fechaDesde, fechaHasta: req.query.fechaHasta }));
        } catch (error) { next(error); }
    });
    router.get("/pedidos/:id", async (req, res, next) => {
        try {
            if (!/^\d+$/.test(req.params.id) || !Number.isSafeInteger(Number(req.params.id)) || Number(req.params.id) <= 0) throw issue(400, "INVALID_ID", "El identificador no es válido.");
            const pedido = await store.detail(Number(req.params.id));
            if (!pedido) throw issue(404, "ORDER_NOT_FOUND", "El pedido no existe.");
            res.json({ data: pedido });
        } catch (error) { next(error); }
    });
    router.post("/pedidos/:id/ubicacion/candidatos", async (req, res, next) => {
        try {
            const id = Number(req.params.id);
            if (!Number.isSafeInteger(id) || id <= 0) throw issue(400, "INVALID_ID", "El identificador no es válido.");
            const order = await store.detail(id);
            if (!order) throw issue(404, "ORDER_NOT_FOUND", "El pedido no existe.");
            let result;
            try { result = await geocode(order); }
            catch (error) { await store.recordGeocode(order, { status: "error", code: error.code }, req.user); throw error; }
            await store.recordGeocode(order, result, req.user);
            res.json({ data: { ...result, version: order.version } });
        } catch (error) { next(error); }
    });
    router.post("/pedidos/:id/ubicacion/confirmacion", async (req, res, next) => {
        try {
            const id = Number(req.params.id), input = req.body;
            if (!Number.isSafeInteger(id) || id <= 0) throw issue(400, "INVALID_ID", "El identificador no es válido.");
            res.json({ data: await store.confirm(id, validateLocation(input), req.user) });
        } catch (error) { next(error); }
    });
    router.post("/pedidos", async (req, res, next) => {
        try {
            const key = req.get("Idempotency-Key");
            if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(key || "")) throw issue(400, "INVALID_KEY", "Falta una clave válida para este envío.");
            const result = await store.create(validateOrder(req.body), key, req.user);
            res.status(result.replayed ? 200 : 201).json({ data: result.pedido });
        } catch (error) { next(error); }
    });
    return router;
}

module.exports = { validateOrder, createOrderStore, createOrders, addressVersion, currentConfirmation };
