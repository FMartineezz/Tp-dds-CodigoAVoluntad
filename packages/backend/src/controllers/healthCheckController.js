export class HealthCheckController {

    check = (req, res) => {
        res.status(200).json({
            status: "ok",
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        });
        }
    }

export default new HealthCheckController();