const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./src/config/database');
const routes = require('./src/routes');
const { metricsMiddleware, register, setDbStatus } = require('./src/middleware/metrics');
const { validateEnv } = require('./src/config/env');

// Load .env first so env vars are populated before validation.
// Platform vars (App Runner) already take precedence over .env entries.
dotenv.config({ path: path.join(__dirname, '.env') });

// Fail fast if critical env vars are missing. This prevents the server from
// starting in a broken state (e.g., unsigned JWTs, no database connection).
validateEnv();

// Init app
const app = express();

const SENSITIVE_LOG_KEYS = new Set([
  'contraseña',
  'password',
  'token',
  'authorization',
  'accesstoken',
  'refreshtoken',
  'jwt'
]);

const sanitizeForLogs = (value) => {
  if (Array.isArray(value)) {
    return value.map(sanitizeForLogs);
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  const sanitized = {};

  for (const [key, val] of Object.entries(value)) {
    if (SENSITIVE_LOG_KEYS.has(key.toLowerCase())) {
      sanitized[key] = '***';
    } else {
      sanitized[key] = sanitizeForLogs(val);
    }
  }

  return sanitized;
};

// Variable global para el estado de la conexión
let dbConnectionStatus = false;

const scheduleReconnect = (intervalMs = 30000) => {
  setInterval(async () => {
    if (!dbConnectionStatus) {
      console.log('Intentando reconectar a MongoDB en segundo plano...');
      await connectWithRetry(1, 2000);
    }
  }, intervalMs);
};

// Connect to database with retry mechanism
const connectWithRetry = async (retries = 5, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Intento ${i + 1} de conexión a la base de datos...`);
      const connection = await connectDB();
      
      if (connection) {
        console.log('Base de datos MongoDB conectada exitosamente');
        dbConnectionStatus = true;
        setDbStatus(true);
        return true;
      }
    } catch (error) {
      console.error(`Error en intento ${i + 1}:`, error);
      if (i < retries - 1) {
        console.log(`Reintentando en ${delay/1000} segundos...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.error('No se pudo establecer conexión con la base de datos después de varios intentos');
  return false;
};

// Prometheus metrics middleware (before routes)
app.use(metricsMiddleware);

// Metrics endpoint for Prometheus scraping
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// CORS — explicitly allow only known origins.
// FRONTEND_URL must be set in App Runner to the deployed frontend domain.
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, Postman, curl).
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin '${origin}' is not allowed`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: false,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Private Network Access header (required by Chrome for localhost-to-localhost fetches)
app.use((req, res, next) => {
  if (req.headers['access-control-request-private-network']) {
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
  }
  next();
});

// Apply body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Middleware para verificar conexión a la base de datos
app.use((req, res, next) => {
  if (!dbConnectionStatus && req.method !== 'GET') {
    return res.status(503).json({
      success: false,
      message: 'El servicio no está disponible temporalmente. Por favor, intente más tarde.'
    });
  }
  next();
});

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Request headers:', sanitizeForLogs(req.headers));
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request body:', JSON.stringify(sanitizeForLogs(req.body), null, 2));
  }
  next();
});

// Routes
app.use('/', routes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'API de RentaCar',
    version: '1.0.0',
    documentacion: '/api/docs',
    dbStatus: dbConnectionStatus ? 'connected' : 'disconnected'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error en la aplicación:');
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server only after attempting database connection
const startServer = async () => {
  const connected = await connectWithRetry();

  if (!connected) {
    console.warn('Servidor iniciado sin base de datos. Las operaciones de escritura responderán 503 hasta reconectar.');
  }
  
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    console.log(`Servidor iniciado en el puerto ${PORT} - http://localhost:${PORT}`);
    console.log(`CORS configurado para permitir solicitudes desde cualquier origen (*)`);
    console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
  });

  scheduleReconnect();
};

startServer(); 