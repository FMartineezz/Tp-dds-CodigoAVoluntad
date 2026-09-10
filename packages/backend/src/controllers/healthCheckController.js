import healthServiceDefault from "../services/healthCheckService.js";

export class HealthCheckController {
    constructor(healthService = healthServiceDefault){
        this.healthService = healthService;
    }

    check = (req, res) => {
        res.status(200).json({
            status: "ok",
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        });
        }
    }

export default new HealthCheckController();