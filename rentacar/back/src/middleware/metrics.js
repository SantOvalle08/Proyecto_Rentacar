const promClient = require('prom-client');

const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

const httpRequestsInProgress = new promClient.Gauge({
  name: 'http_requests_in_progress',
  help: 'Number of HTTP requests currently in progress',
  labelNames: ['method'],
  registers: [register],
});

const dbConnectionStatus = new promClient.Gauge({
  name: 'db_connection_status',
  help: 'Database connection status (1 = connected, 0 = disconnected)',
  registers: [register],
});

function normalizeRoute(req) {
  const path = req.route ? req.route.path : req.path;
  // Replace MongoDB ObjectIds and numeric IDs to avoid high cardinality
  return path
    .replace(/\/[a-f0-9]{24}/gi, '/:id')
    .replace(/\/\d+/g, '/:id');
}

function metricsMiddleware(req, res, next) {
  if (req.path === '/metrics') return next();

  const start = process.hrtime.bigint();
  httpRequestsInProgress.inc({ method: req.method });

  res.on('finish', () => {
    const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9;
    const route = normalizeRoute(req);
    const labels = {
      method: req.method,
      route,
      status_code: String(res.statusCode),
    };
    httpRequestDuration.observe(labels, durationSeconds);
    httpRequestsTotal.inc(labels);
    httpRequestsInProgress.dec({ method: req.method });
  });

  next();
}

function setDbStatus(connected) {
  dbConnectionStatus.set(connected ? 1 : 0);
}

module.exports = { metricsMiddleware, register, setDbStatus };
