const addressRepository = require("../repositories/address.repository");

const OPTIONAL_FIELDS = ["postal_code", "latitude", "longitude"];

class AddressService {
    async list() {
        return addressRepository.findAll();
    }

    async get(id) {
        const address = await addressRepository.findById(id);
        if (!address) {
            const error = new Error("Dirección no encontrada");
            error.status = 404;
            throw error;
        }
        return address;
    }

    async create(data) {
        const clean = this.sanitize(data);
        this.validate(clean);
        return addressRepository.create(clean);
    }

    async update(id, data) {
        await this.get(id);
        const clean = this.sanitize(data);
        this.validate(clean);
        return addressRepository.update(id, clean);
    }

    async remove(id) {
        await this.get(id);
        return addressRepository.remove(id);
    }

    sanitize(data) {
        const clean = { ...data };
        for (const field of OPTIONAL_FIELDS) {
            if (clean[field] === undefined || clean[field] === null || clean[field] === "") {
                clean[field] = null;
            }
        }
        return clean;
    }

    validate({ street, number, city, province }) {
        const required = { street, number, city, province };
        const missing = Object.entries(required)
            .filter(([, value]) => value === undefined || value === null || String(value).trim() === "")
            .map(([key]) => key);

        if (missing.length > 0) {
            const error = new Error(`Campos requeridos: ${missing.join(", ")}`);
            error.status = 400;
            throw error;
        }
    }
}

module.exports = new AddressService();