const pool = require("../config/db");

const TABLE = "addresses";
const COLUMNS = "street, number, city, province, postal_code, latitude, longitude";
const PLACEHOLDERS = "?, ?, ?, ?, ?, ?, ?";

async function findAll() {
    const [rows] = await pool.query(`SELECT * FROM ${TABLE}`);
    return rows;
}

async function findById(id) {
    const [rows] = await pool.query(`SELECT * FROM ${TABLE} WHERE id = ?`, [id]);
    return rows[0] || null;
}

async function create(address) {
    const [result] = await pool.query(
        `INSERT INTO ${TABLE} (${COLUMNS}) VALUES (${PLACEHOLDERS})`,
        [address.street, address.number, address.city, address.province, address.postal_code, address.latitude, address.longitude]
    );
    return findById(result.insertId);
}

async function update(id, address) {
    await pool.query(
        `UPDATE ${TABLE} SET street = ?, number = ?, city = ?, province = ?, postal_code = ?, latitude = ?, longitude = ? WHERE id = ?`,
        [address.street, address.number, address.city, address.province, address.postal_code, address.latitude, address.longitude, id]
    );
    return findById(id);
}

async function remove(id) {
    const [result] = await pool.query(`DELETE FROM ${TABLE} WHERE id = ?`, [id]);
    return result.affectedRows > 0;
}

module.exports = { findAll, findById, create, update, remove };