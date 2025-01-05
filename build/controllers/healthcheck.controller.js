"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthcheck = void 0;
const healthcheck = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            message: { Status: 'UP' },
        });
    }
    catch (error) {
        console.log(error);
    }
};
exports.healthcheck = healthcheck;
