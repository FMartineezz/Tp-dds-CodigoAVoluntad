/** Endpoint para chequear que el backend está vivo (routes/healthCheckRoutes.js). */
export class HealthCheckController {
  /**
   * GET /healthCheck → 200 con `{ status: "ok", uptime, timestamp }`.
   * @param {import("../types.js").RequestConParams} req
   * @param {import("express").Response} res
   */
  check = (req, res) => {
    res.status(200).json({
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  };
}
