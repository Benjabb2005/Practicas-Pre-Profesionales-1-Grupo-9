const addressService = require("../services/address.service");

async function list(req, res) {
    const addresses = await addressService.list();
    res.json({ data: addresses });
}

async function get(req, res) {
    const address = await addressService.get(req.params.id);
    res.json({ data: address });
}

async function create(req, res) {
    const address = await addressService.create(req.body);
    res.status(201).json({ data: address });
}

async function update(req, res) {
    const address = await addressService.update(req.params.id, req.body);
    res.json({ data: address });
}

async function remove(req, res) {
    await addressService.remove(req.params.id);
    res.status(204).send();
}

module.exports = { list, get, create, update, remove };