/**
 * Configuración para tests de RNF
 */

module.exports = {
  // URL base de la API
  API_BASE_URL: process.env.API_URL || 'http://localhost:5001',
  
  // Credenciales de prueba
  TEST_USER: {
    email: 'test@example.com',
    password: 'Test123456',
    nombre: 'Usuario Test'
  },
  
  TEST_ADMIN: {
    email: 'admin@rentacar.com',
    password: 'Admin123456',
    nombre: 'Admin Test'
  },
  
  // Umbrales de performance (RNF-001)
  PERFORMANCE_THRESHOLDS: {
    simpleQuery: 200,      // ms - consultas GET simples
    complexQuery: 500,     // ms - consultas con JOIN/populate
    postOperation: 300,    // ms - operaciones POST/PUT
    deleteOperation: 250   // ms - operaciones DELETE
  },
  
  // Configuración de load testing (RNF-003)
  LOAD_TEST: {
    minConcurrentUsers: 50,
    targetConcurrentUsers: 100,
    maxConcurrentUsers: 150,
    duration: 60,          // segundos
    rampUp: 10             // segundos
  },
  
  // Configuración de memoria (RNF-004)
  MEMORY_THRESHOLDS: {
    maxMemoryMB: 512,
    maxMemoryIncreaseMB: 50,  // aumento permitido después de 1000 ops
    iterations: 1000
  },
  
  // Configuración de seguridad (RNF-018, RNF-020)
  SECURITY: {
    minBcryptRounds: 10,
    tokenExpirationHours: 24,
    maxLoginAttempts: 5
  },
  
  // Colores para output
  COLORS: {
    RESET: '\x1b[0m',
    RED: '\x1b[31m',
    GREEN: '\x1b[32m',
    YELLOW: '\x1b[33m',
    BLUE: '\x1b[34m',
    CYAN: '\x1b[36m'
  }
};
