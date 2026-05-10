/**
 * TEST-001: Performance de API Endpoints
 * RNF Validados: RNF-001 (Tiempo de respuesta), RNF-005 (Optimización de consultas)
 * 
 * Este test mide los tiempos de respuesta de los endpoints principales de la API
 * y los compara con los umbrales definidos en los RNF.
 */

const axios = require('axios');
const config = require('../config');

class APIPerformanceTest {
  constructor() {
    this.results = [];
    this.apiUrl = config.API_BASE_URL;
    this.token = null;
  }

  // Utilidad para medir tiempo
  async measureTime(fn) {
    const start = Date.now();
    await fn();
    return Date.now() - start;
  }

  // Utilidad para logging
  log(message, type = 'info') {
    const colors = config.COLORS;
    const timestamp = new Date().toISOString();
    
    switch(type) {
      case 'success':
        console.log(`${colors.GREEN}✓ [${timestamp}] ${message}${colors.RESET}`);
        break;
      case 'error':
        console.log(`${colors.RED}✗ [${timestamp}] ${message}${colors.RESET}`);
        break;
      case 'warning':
        console.log(`${colors.YELLOW}⚠ [${timestamp}] ${message}${colors.RESET}`);
        break;
      case 'header':
        console.log(`\n${colors.CYAN}${'='.repeat(70)}`);
        console.log(`${message}`);
        console.log(`${'='.repeat(70)}${colors.RESET}\n`);
        break;
      default:
        console.log(`${colors.BLUE}ℹ [${timestamp}] ${message}${colors.RESET}`);
    }
  }

  // Autenticar y obtener token
  async authenticate() {
    try {
      this.log('Autenticando usuario de prueba...', 'info');
      
      const response = await axios.post(`${this.apiUrl}/api/usuarios/login`, {
        email: config.TEST_USER.email,
        password: config.TEST_USER.password
      });

      if (response.data.token) {
        this.token = response.data.token;
        this.log('Autenticación exitosa', 'success');
        return true;
      }
      return false;
    } catch (error) {
      this.log('Error en autenticación: ' + error.message, 'warning');
      this.log('Continuando tests sin autenticación...', 'info');
      return false;
    }
  }

  // Headers con autenticación
  getHeaders() {
    return this.token ? {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    } : {
      'Content-Type': 'application/json'
    };
  }

  // Test 1: GET /api/autos (consulta simple)
  async testGetAllAutos() {
    this.log('Test: GET /api/autos (Consulta simple)', 'header');
    
    try {
      const iterations = 10;
      const times = [];

      for (let i = 0; i < iterations; i++) {
        const time = await this.measureTime(async () => {
          await axios.get(`${this.apiUrl}/api/autos`);
        });
        times.push(time);
        this.log(`Iteración ${i + 1}/${iterations}: ${time}ms`);
      }

      const avgTime = times.reduce((a, b) => a + b) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);
      const threshold = config.PERFORMANCE_THRESHOLDS.simpleQuery;

      const result = {
        endpoint: 'GET /api/autos',
        type: 'Consulta Simple',
        avgTime: avgTime.toFixed(2),
        minTime,
        maxTime,
        threshold,
        passed: avgTime <= threshold,
        rnf: 'RNF-001'
      };

      this.results.push(result);

      this.log(`\nResultados:`, 'info');
      this.log(`  Tiempo promedio: ${avgTime.toFixed(2)}ms`);
      this.log(`  Tiempo mínimo: ${minTime}ms`);
      this.log(`  Tiempo máximo: ${maxTime}ms`);
      this.log(`  Umbral: ${threshold}ms`);
      
      if (result.passed) {
        this.log(`  Estado: APROBADO ✓`, 'success');
      } else {
        this.log(`  Estado: FALLIDO ✗ (Excede umbral por ${(avgTime - threshold).toFixed(2)}ms)`, 'error');
      }

    } catch (error) {
      this.log(`Error en test: ${error.message}`, 'error');
      this.results.push({
        endpoint: 'GET /api/autos',
        error: error.message,
        passed: false,
        rnf: 'RNF-001'
      });
    }
  }

  // Test 2: GET /api/autos/:id (consulta por ID)
  async testGetAutoById() {
    this.log('Test: GET /api/autos/:id (Consulta por ID)', 'header');
    
    try {
      // Primero obtener un ID válido
      const autosResponse = await axios.get(`${this.apiUrl}/api/autos`);
      
      if (!autosResponse.data.autos || autosResponse.data.autos.length === 0) {
        this.log('No hay autos en la BD para testear', 'warning');
        return;
      }

      const autoId = autosResponse.data.autos[0].idAuto;
      this.log(`Usando auto ID: ${autoId}`, 'info');

      const iterations = 10;
      const times = [];

      for (let i = 0; i < iterations; i++) {
        const time = await this.measureTime(async () => {
          await axios.get(`${this.apiUrl}/api/autos/${autoId}`);
        });
        times.push(time);
        this.log(`Iteración ${i + 1}/${iterations}: ${time}ms`);
      }

      const avgTime = times.reduce((a, b) => a + b) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);
      const threshold = config.PERFORMANCE_THRESHOLDS.simpleQuery;

      const result = {
        endpoint: `GET /api/autos/${autoId}`,
        type: 'Consulta por ID',
        avgTime: avgTime.toFixed(2),
        minTime,
        maxTime,
        threshold,
        passed: avgTime <= threshold,
        rnf: 'RNF-001'
      };

      this.results.push(result);

      this.log(`\nResultados:`, 'info');
      this.log(`  Tiempo promedio: ${avgTime.toFixed(2)}ms`);
      this.log(`  Tiempo mínimo: ${minTime}ms`);
      this.log(`  Tiempo máximo: ${maxTime}ms`);
      this.log(`  Umbral: ${threshold}ms`);
      
      if (result.passed) {
        this.log(`  Estado: APROBADO ✓`, 'success');
      } else {
        this.log(`  Estado: FALLIDO ✗`, 'error');
      }

    } catch (error) {
      this.log(`Error en test: ${error.message}`, 'error');
    }
  }

  // Test 3: GET /api/reservas (consulta compleja con populate)
  async testGetReservas() {
    this.log('Test: GET /api/reservas (Consulta compleja)', 'header');
    
    if (!this.token) {
      this.log('Test omitido: requiere autenticación', 'warning');
      return;
    }

    try {
      const iterations = 10;
      const times = [];

      for (let i = 0; i < iterations; i++) {
        const time = await this.measureTime(async () => {
          await axios.get(`${this.apiUrl}/api/reservas`, {
            headers: this.getHeaders()
          });
        });
        times.push(time);
        this.log(`Iteración ${i + 1}/${iterations}: ${time}ms`);
      }

      const avgTime = times.reduce((a, b) => a + b) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);
      const threshold = config.PERFORMANCE_THRESHOLDS.complexQuery;

      const result = {
        endpoint: 'GET /api/reservas',
        type: 'Consulta Compleja (con populate)',
        avgTime: avgTime.toFixed(2),
        minTime,
        maxTime,
        threshold,
        passed: avgTime <= threshold,
        rnf: 'RNF-001, RNF-005'
      };

      this.results.push(result);

      this.log(`\nResultados:`, 'info');
      this.log(`  Tiempo promedio: ${avgTime.toFixed(2)}ms`);
      this.log(`  Tiempo mínimo: ${minTime}ms`);
      this.log(`  Tiempo máximo: ${maxTime}ms`);
      this.log(`  Umbral: ${threshold}ms`);
      
      if (result.passed) {
        this.log(`  Estado: APROBADO ✓`, 'success');
      } else {
        this.log(`  Estado: FALLIDO ✗`, 'error');
      }

    } catch (error) {
      this.log(`Error en test: ${error.message}`, 'error');
    }
  }

  // Test 4: POST operation
  async testPostOperation() {
    this.log('Test: POST operation (Creación de recurso)', 'header');
    
    try {
      const iterations = 5;
      const times = [];

      for (let i = 0; i < iterations; i++) {
        const time = await this.measureTime(async () => {
          try {
            await axios.post(`${this.apiUrl}/api/usuarios/register`, {
              email: `test${Date.now()}@example.com`,
              password: 'Test123456',
              nombre: 'Test User',
              telefono: '1234567890'
            });
          } catch (err) {
            // Ignorar errores de duplicado
            if (!err.response || err.response.status !== 400) {
              throw err;
            }
          }
        });
        times.push(time);
        this.log(`Iteración ${i + 1}/${iterations}: ${time}ms`);
      }

      const avgTime = times.reduce((a, b) => a + b) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);
      const threshold = config.PERFORMANCE_THRESHOLDS.postOperation;

      const result = {
        endpoint: 'POST /api/usuarios/register',
        type: 'Operación POST',
        avgTime: avgTime.toFixed(2),
        minTime,
        maxTime,
        threshold,
        passed: avgTime <= threshold,
        rnf: 'RNF-001'
      };

      this.results.push(result);

      this.log(`\nResultados:`, 'info');
      this.log(`  Tiempo promedio: ${avgTime.toFixed(2)}ms`);
      this.log(`  Tiempo mínimo: ${minTime}ms`);
      this.log(`  Tiempo máximo: ${maxTime}ms`);
      this.log(`  Umbral: ${threshold}ms`);
      
      if (result.passed) {
        this.log(`  Estado: APROBADO ✓`, 'success');
      } else {
        this.log(`  Estado: FALLIDO ✗`, 'error');
      }

    } catch (error) {
      this.log(`Error en test: ${error.message}`, 'error');
    }
  }

  // Generar reporte
  generateReport() {
    this.log('REPORTE FINAL - TEST DE PERFORMANCE API', 'header');
    
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    const percentage = ((passed / total) * 100).toFixed(2);

    console.log('\n');
    console.table(this.results.map(r => ({
      'Endpoint': r.endpoint,
      'Tipo': r.type,
      'Tiempo Avg (ms)': r.avgTime,
      'Umbral (ms)': r.threshold,
      'Estado': r.passed ? '✓ PASS' : '✗ FAIL',
      'RNF': r.rnf
    })));

    this.log(`\nResumen:`, 'info');
    this.log(`  Tests ejecutados: ${total}`);
    this.log(`  Tests aprobados: ${passed}`, passed === total ? 'success' : 'warning');
    this.log(`  Tests fallidos: ${total - passed}`, total - passed === 0 ? 'success' : 'error');
    this.log(`  Porcentaje de éxito: ${percentage}%`, percentage >= 80 ? 'success' : 'error');

    return {
      total,
      passed,
      failed: total - passed,
      percentage,
      results: this.results
    };
  }

  // Ejecutar todos los tests
  async runAll() {
    this.log('INICIANDO TESTS DE PERFORMANCE DE API', 'header');
    this.log(`API URL: ${this.apiUrl}`, 'info');
    this.log(`Fecha: ${new Date().toISOString()}`, 'info');
    
    await this.authenticate();
    
    await this.testGetAllAutos();
    await this.testGetAutoById();
    await this.testGetReservas();
    await this.testPostOperation();
    
    return this.generateReport();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const test = new APIPerformanceTest();
  test.runAll()
    .then(report => {
      const fs = require('fs');
      const outputPath = '../resultados/performance-api-results.json';
      fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
      console.log(`\nResultados guardados en: ${outputPath}`);
      
      process.exit(report.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Error fatal:', error);
      process.exit(1);
    });
}

module.exports = APIPerformanceTest;
