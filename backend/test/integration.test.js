const { test } = require("node:test");
const assert = require("node:assert/strict");
const { randomBytes } = require("node:crypto");
const { once } = require("node:events");
const { createDatabase } = require("../database");
const { createAuthStore } = require("../auth-store");
const { createApp } = require("../app");
const { migrate } = require("../migrate");
const { createUser } = require("../create-user");
const { createOrderStore, validateOrder, addressVersion } = require("../orders");
const { createUserStore } = require("../users");

const enabled = /^mandatodo_test_[a-z0-9_]+$/.test(process.env.TEST_DB_NAME || "");

test("MySQL aislado: migración repetible, cuentas, sesión y revocación persistidas", { skip: !enabled }, async () => {
    const database = createDatabase({ ...process.env, DB_NAME: process.env.TEST_DB_NAME });
    let server;
    try {
        const [before] = await database.pool.query("SHOW TABLES");
        assert.equal(before.length, 0, "Se requiere una base de prueba nueva; no modificar datos existentes.");
        const dry = await migrate(database.pool);
        assert.equal(dry.mode, "dry-run");
        const [stillEmpty] = await database.pool.query("SHOW TABLES");
        assert.equal(stillEmpty.length, 0);
        const first = await migrate(database.pool, { apply: true });
        assert.equal(first.baseline, "new");
        assert.equal(first.migrations[0].status, "applied");
        const password = randomBytes(24).toString("hex");
        const userData = { nombre: "Usuario sintético", email: "integration@example.invalid", password, rol: "operador" };
        await createUser(database.pool, userData);
        await assert.rejects(createUser(database.pool, userData));
        const repeated = await migrate(database.pool, { apply: true });
        assert.equal(repeated.migrations[0].status, "already-applied");
        const [users] = await database.pool.query("SELECT COUNT(*) AS total FROM usuarios");
        assert.equal(users[0].total, 1, "La migración repetida conserva datos y el bootstrap no duplica cuentas.");

        const origin = "http://localhost:5173";
        const orders = createOrderStore(database.pool);
        server = createApp({ checkDatabase: database.checkDatabase, orders, users: createUserStore(database.pool),
            auth: { store: createAuthStore(database.pool), secret: randomBytes(48).toString("hex"), allowedOrigin: origin },
        }).listen(0, "127.0.0.1");
        await once(server, "listening");
        const url = `http://127.0.0.1:${server.address().port}`;
        async function request(path, options = {}) {
            return fetch(`${url}${path}`, { ...options, signal: AbortSignal.timeout(5000) });
        }
        assert.equal((await request("/health/ready")).status, 200);
        const login = await request("/api/sesion", { method: "POST", headers: { Origin: origin, "Content-Type": "application/json" },
            body: JSON.stringify({ email: userData.email, password }) });
        assert.equal(login.status, 200);
        const cookie = login.headers.get("set-cookie").split(";")[0];
        assert.equal((await request("/api/usuarios")).status, 401);
        assert.equal((await request("/api/usuarios", { headers: { Cookie: cookie } })).status, 403);
        const employee = { nombre: "Empleado de prueba", email: "employee@example.invalid", rol: "operador", password: randomBytes(24).toString("hex") };
        assert.equal((await request("/api/usuarios", { method: "POST", headers: { Cookie: cookie, Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify(employee) })).status, 403);
        // Solo la cuenta de prueba se convierte en admin, en esta base aislada.
        await database.pool.execute("UPDATE usuarios SET rol = 'admin' WHERE email = ?", [userData.email]);
        const adminHeaders = { Cookie: cookie, Origin: origin, "Content-Type": "application/json" };
        const newEmployee = await request("/api/usuarios", { method: "POST", headers: adminHeaders, body: JSON.stringify(employee) });
        assert.equal(newEmployee.status, 201);
        assert.deepEqual(Object.keys((await newEmployee.json()).data).sort(), ["activo", "email", "id", "nombre", "rol"]);
        assert.equal((await request("/api/usuarios", { method: "POST", headers: adminHeaders, body: JSON.stringify(employee) })).status, 409);
        assert.equal((await request("/api/usuarios", { method: "POST", headers: adminHeaders, body: JSON.stringify({ ...employee, rol: "superuser" }) })).status, 422);
        assert.equal((await request("/api/usuarios", { method: "POST", headers: adminHeaders, body: JSON.stringify({ ...employee, activo: 1 }) })).status, 400);
        assert.equal((await request("/api/usuarios", { method: "POST", headers: adminHeaders, body: JSON.stringify({ ...employee, password: "corta" }) })).status, 422);
        const allUsers = await request("/api/usuarios", { headers: { Cookie: cookie } });
        assert.equal(allUsers.status, 200);
        const listed = (await allUsers.json()).data;
        assert.equal(listed.length, 2);
        assert.ok(listed.every((u) => !Object.hasOwn(u, "password_hash") && !Object.hasOwn(u, "password")));
        const employeeLogin = await request("/api/sesion", { method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify({ email: employee.email, password: employee.password }) });
        assert.equal(employeeLogin.status, 200);
        const employeeCookie = employeeLogin.headers.get("set-cookie").split(";")[0];
        assert.equal((await request("/api/usuarios", { headers: { Cookie: employeeCookie } })).status, 403);
        assert.equal((await request("/api/sesion", { method: "DELETE", headers: { Cookie: employeeCookie, Origin: origin } })).status, 204);
        assert.equal((await request("/api/pedidos")).status, 401);
        const orderInput = { cliente: { nombre: "Cliente sintético", apellido: "Prueba", dni: "80000001", telefono: "1100000001", email: "pedido@example.invalid" },
            direccion: { direccionOriginal: "Calle sintética 123, localidad de prueba", calle: "Calle sintética", altura: "123", pisoDepto: "", localidad: "Localidad de prueba", provincia: "Provincia de prueba", codigoPostal: "1000" } };
        const orderKey = require("node:crypto").randomUUID();
        const headers = { Cookie: cookie, Origin: origin, "Content-Type": "application/json", "Idempotency-Key": orderKey };
        const created = await request("/api/pedidos", { method: "POST", headers, body: JSON.stringify(orderInput) });
        assert.equal(created.status, 201);
        const order = (await created.json()).data;
        assert.equal(order.codigo, `PED-${order.id}`);
        const [storedCode] = await database.pool.execute('SELECT codigo FROM pedidos WHERE id = ?', [order.id]);
        assert.equal(storedCode[0].codigo, order.codigo);
        assert.equal(order.estado, "pendiente_validacion");
        assert.equal((await request(`/api/pedidos/${order.id}`, { headers: { Cookie: cookie } })).status, 200);
        const confirmationUrl = `/api/pedidos/${order.id}/ubicacion/confirmacion`;
        const confirmation = { version: order.version, lat: -34.6, lng: -58.4, observation: "Revisión sintética de ubicación" };
        assert.equal((await request(confirmationUrl, { method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify(confirmation) })).status, 401);
        assert.equal((await request(confirmationUrl, { method: "POST", headers, body: JSON.stringify({ ...confirmation, observation: "" }) })).status, 422);
        assert.equal((await request(confirmationUrl, { method: "POST", headers: { ...headers, Origin: "http://example.invalid" }, body: JSON.stringify(confirmation) })).status, 403);
        const confirmed = await request(confirmationUrl, { method: "POST", headers, body: JSON.stringify(confirmation) });
        assert.equal(confirmed.status, 200);
        assert.equal((await confirmed.json()).data.confirmation.version, order.version);
        const persistedReview = await orders.detail(order.id);
        assert.equal(persistedReview.confirmation.observation, confirmation.observation);
        assert.equal(persistedReview.estado, "pendiente_validacion", "Confirmar no despacha automáticamente.");
        await database.pool.execute("UPDATE direcciones d JOIN pedidos p ON p.direccion_id = d.id SET d.altura = '124' WHERE p.id = ?", [order.id]);
        assert.equal((await orders.detail(order.id)).confirmation, null);
        assert.equal((await request(confirmationUrl, { method: "POST", headers, body: JSON.stringify(confirmation) })).status, 409);
        await database.pool.execute("UPDATE direcciones d JOIN pedidos p ON p.direccion_id = d.id SET d.altura = ? WHERE p.id = ?", [orderInput.direccion.altura, order.id]);
        assert.equal((await orders.detail(order.id)).confirmation, null, "Restaurar texto anterior no revive una confirmación.");
        const latest = await orders.detail(order.id);
        assert.equal(Number(latest.addressRevision), Number(order.addressRevision) + 2);
        assert.equal((await request(confirmationUrl, { method: "POST", headers, body: JSON.stringify({ ...confirmation, version: latest.version }) })).status, 200);
        const newAddress = { ...orderInput.direccion, altura: '125' };
        const locatedInput = { ...orderInput, clienteId: order.clienteId, direccion: newAddress, ubicacion: { version: addressVersion({ ...newAddress, addressRevision: 1 }), lat: -34.6, lng: -58.4, observation: 'Revisión sintética en carga' } };
        const locatedHeaders = { ...headers, 'Idempotency-Key': require('node:crypto').randomUUID() };
        const locatedResponse = await request('/api/pedidos', { method: 'POST', headers: locatedHeaders, body: JSON.stringify(locatedInput) });
        assert.equal(locatedResponse.status, 201);
        const locatedOrder = (await locatedResponse.json()).data;
        await database.pool.execute("UPDATE pedidos SET created_at = '2026-10-12 03:00:00' WHERE id = ?", [locatedOrder.id]);
        assert.equal(locatedOrder.confirmation.observation, locatedInput.ubicacion.observation);
        const repeatedLocated = await request('/api/pedidos', { method: 'POST', headers: locatedHeaders, body: JSON.stringify(locatedInput) });
        assert.equal(repeatedLocated.status, 200);
        assert.equal((await repeatedLocated.json()).data.id, locatedOrder.id);
        const [reviewCount] = await database.pool.execute('SELECT COUNT(*) AS total FROM historial_geolocalizacion WHERE pedido_id = ? AND confirmado_por_operador = 1', [locatedOrder.id]);
        assert.equal(reviewCount[0].total, 1, 'Reintento de carga conserva una sola confirmación.');
        const staleInput = { ...locatedInput, direccion: { ...newAddress, altura: '126' } };
        assert.equal((await request('/api/pedidos', { method: 'POST', headers: { ...locatedHeaders, 'Idempotency-Key': require('node:crypto').randomUUID() }, body: JSON.stringify(staleInput) })).status, 409);
        const repeatedOrder = await request("/api/pedidos", { method: "POST", headers, body: JSON.stringify(orderInput) });
        assert.equal(repeatedOrder.status, 200);
        assert.equal((await repeatedOrder.json()).data.id, order.id);
        assert.equal((await request("/api/pedidos", { method: "POST", headers, body: JSON.stringify({ ...orderInput, observaciones: "cambio" }) })).status, 409);
        const secondHeaders = { ...headers, "Idempotency-Key": require("node:crypto").randomUUID() };
        assert.equal((await request("/api/pedidos", { method: "POST", headers: secondHeaders, body: JSON.stringify(orderInput) })).status, 409);
        for (const field of ["dni", "email", "telefono"]) {
            const cliente = { nombre: "Otra persona sintética", apellido: "Prueba", dni: "80000002", telefono: "1100000002", email: "otra@example.invalid" };
            cliente[field] = field === "telefono" ? "(11) 0000-0001" : field === "email" ? " PEDIDO@EXAMPLE.INVALID " : orderInput.cliente[field];
            const duplicate = await request("/api/pedidos", { method: "POST", headers: { ...headers, "Idempotency-Key": require("node:crypto").randomUUID() }, body: JSON.stringify({ ...orderInput, cliente }) });
            assert.equal(duplicate.status, 409, `Coincidencia independiente por ${field}`);
            const conflict = (await duplicate.json()).error;
            assert.equal(conflict.code, "CLIENT_ALREADY_EXISTS");
            assert.ok(conflict.fields[field]);
        }
        const bypass = await request("/api/pedidos", { method: "POST", headers: secondHeaders, body: JSON.stringify({ ...orderInput, reconocerDuplicado: true }) });
        assert.equal(bypass.status, 400, "La bandera antigua no permite omitir el bloqueo.");
        const [uniqueClients] = await database.pool.query("SELECT COUNT(*) AS total FROM clientes");
        assert.equal(uniqueClients[0].total, 1);
        const frequent = await request("/api/clientes/frecuentes?q=80000001", { headers: { Cookie: cookie } });
        assert.equal(frequent.status, 200);
        assert.equal((await frequent.json()).data.length, 1);
        const simultaneousHeaders = { ...headers, "Idempotency-Key": require("node:crypto").randomUUID() };
        const simultaneousBody = JSON.stringify({ ...orderInput, clienteId: order.clienteId });
        const concurrent = await Promise.all([1, 2].map(() => request("/api/pedidos", { method: "POST", headers: simultaneousHeaders, body: simultaneousBody })));
        assert.deepEqual(concurrent.map((r) => r.status).sort(), [200, 201]);
        const concurrentData = await Promise.all(concurrent.map((r) => r.json()));
        assert.equal(concurrentData[0].data.id, concurrentData[1].data.id, "Solicitudes simultáneas guardan un solo pedido.");
        await database.pool.execute("UPDATE pedidos SET created_at = '2026-10-13 02:59:00' WHERE id = ?", [order.id]);
        await database.pool.execute("UPDATE pedidos SET created_at = '2026-10-13 03:00:00' WHERE id = ?", [concurrentData[0].data.id]);
        const localDay = await request("/api/pedidos?fechaDesde=2026-10-13&fechaHasta=2026-10-13", { headers: { Cookie: cookie } });
        const localDayData = await localDay.json();
        assert.equal(localDayData.pagination.total, 1);
        assert.equal(localDayData.data[0].id, concurrentData[0].data.id, "Filtro respeta medianoche de Buenos Aires, no UTC.");
        const incomplete = { ...orderInput, direccion: { ...orderInput.direccion, altura: "0" } };
        assert.equal((await request("/api/pedidos", { method: "POST", headers: secondHeaders, body: JSON.stringify(incomplete) })).status, 422);
        assert.equal((await request("/api/pedidos?estado=listo_despacho", { headers: { Cookie: cookie } })).status, 200);
        assert.equal((await request("/api/pedidos?page=1.5", { headers: { Cookie: cookie } })).status, 400);
        assert.equal((await request("/api/pedidos?fechaDesde=2026-02-30", { headers: { Cookie: cookie } })).status, 400);

        const newClientsConcurrent = await Promise.all([1, 2].map((n) => request("/api/pedidos", {
            method: "POST", headers: { ...headers, "Idempotency-Key": require("node:crypto").randomUUID() },
            body: JSON.stringify({ ...orderInput, cliente: { ...orderInput.cliente, dni: "80000004", telefono: `110000000${n + 4}`, email: `concurrent-${n}@example.invalid` } }),
        })));
        assert.deepEqual(newClientsConcurrent.map((r) => r.status).sort(), [201, 409], "Dos altas con DNI coincidente crean un solo cliente.");
        for (const [q, expected] of [["8", 2], ["8000000", 2], ["80000001", 1], ["PEDIDO@", 1], ["(11) 0000-0001", 1], ["(11) 0000-000", 2], ["%", 0], ["_", 0], ["sin-coincidencias", 0]]) {
            const filtered = await request(`/api/clientes/frecuentes?q=${encodeURIComponent(q)}`, { headers: { Cookie: cookie } });
            assert.equal(filtered.status, 200);
            assert.equal((await filtered.json()).data.length, expected, `Filtro parcial ${q}`);
        }
        assert.equal((await request("/api/clientes/frecuentes?q=", { headers: { Cookie: cookie } })).status, 400);

        const [countsBefore] = await database.pool.query("SELECT (SELECT COUNT(*) FROM clientes) AS clientes, (SELECT COUNT(*) FROM direcciones) AS direcciones, (SELECT COUNT(*) FROM pedidos) AS pedidos");
        let reachedOrderInsert = false;
        const faultyPool = { async getConnection() {
            const connection = await database.pool.getConnection();
            return { beginTransaction: () => connection.beginTransaction(), commit: () => connection.commit(), rollback: () => connection.rollback(), release: () => connection.release(),
                query(sql, values) { return connection.query(sql, values); },
                execute(sql, values) { if (sql.startsWith("INSERT INTO pedidos")) { reachedOrderInsert = true; throw new Error("Fallo sintético"); } return connection.execute(sql, values); } };
        } };
        const failureInput = validateOrder({ ...orderInput, cliente: { ...orderInput.cliente, dni: "80000002", telefono: "1100000002", email: "fallo@example.invalid" } });
        await assert.rejects(createOrderStore(faultyPool).create(failureInput, require("node:crypto").randomUUID(), { id: 1 }));
        assert.equal(reachedOrderInsert, true, "El fallo sucede después de insertar cliente y dirección.");
        const [countsAfter] = await database.pool.query("SELECT (SELECT COUNT(*) FROM clientes) AS clientes, (SELECT COUNT(*) FROM direcciones) AS direcciones, (SELECT COUNT(*) FROM pedidos) AS pedidos");
        assert.deepEqual(countsAfter, countsBefore, "Fallo tras cliente/dirección revierte toda la transacción.");
        const [sessions] = await database.pool.query("SELECT COUNT(*) AS total FROM sesiones WHERE revocada_en IS NULL");
        assert.equal(sessions[0].total, 1);
        assert.equal((await request("/api/sesion", { headers: { Cookie: cookie } })).status, 200);
        assert.equal((await request("/api/sesion", { method: "DELETE", headers: { Cookie: cookie, Origin: origin } })).status, 204);
        assert.equal((await request("/api/sesion", { headers: { Cookie: cookie } })).status, 401);
        const [revoked] = await database.pool.query("SELECT COUNT(*) AS total FROM sesiones WHERE revocada_en IS NOT NULL");
        assert.equal(revoked[0].total, 2, "Las sesiones del empleado y del administrador quedaron revocadas.");
    } finally {
        if (server) await new Promise((resolve, reject) => {
            server.close((error) => error ? reject(error) : resolve());
            server.closeAllConnections();
        });
        await database.close();
    }
});
