/**
 * @module middleware/cors
 * @description Middleware para configurar CORS (Cross-Origin Resource Sharing)
 */

/**
 * @typedef {Object} CorsConfig
 * @property {string} origin - Origen permitido para las solicitudes
 * @property {string} methods - Métodos HTTP permitidos
 * @property {boolean} credentials - Si se permiten credenciales
 * @property {string} allowedHeaders - Encabezados permitidos
 * @property {string} exposedHeaders - Encabezados expuestos en las respuestas
 * @property {string} maxAge - Tiempo de caché para solicitudes preflight
 */

/**
 * Middleware para configurar CORS (Cross-Origin Resource Sharing)
 * Permite controlar qué dominios pueden acceder a la API y qué métodos/encabezados están permitidos
 * 
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Función para continuar con el siguiente middleware
 * @returns {void|Object} Continúa al siguiente middleware o responde a solicitudes preflight
 * 
 * @example
 * // Configuración básica
 * app.use(corsMiddleware);
 * 
 * @example
 * // Configuración con opciones personalizadas
 * app.use((req, res, next) => {
 *   corsMiddleware(req, res, next);
 * });
 */
const corsMiddleware = (req, res, next) => {
  // Siempre permitir localhost:3000 independientemente de headers
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  
  // Métodos HTTP permitidos - incluir OPTIONS es crucial
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  // Permitir credenciales (cookies, encabezados de autenticación)
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Encabezados permitidos - asegurarse que todos los encabezados necesarios estén incluidos
  res.setHeader('Access-Control-Allow-Headers', 
    'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Permitir ciertos encabezados en las respuestas
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, X-Token');
  
  // Cachear preflight OPTIONS requests por 3600 segundos (1 hora)
  res.setHeader('Access-Control-Max-Age', '3600');
  
  // Manejar solicitudes preflight OPTIONS
  if (req.method === 'OPTIONS') {
    console.log('Recibida solicitud OPTIONS (preflight)');
    return res.status(204).end(); // 204 No Content es mejor para respuestas preflight
  }
  
  next();
};

module.exports = corsMiddleware; 