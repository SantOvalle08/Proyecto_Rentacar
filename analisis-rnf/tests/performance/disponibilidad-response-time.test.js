/**
 * TEST-002: Performance de Verificación de Disponibilidad
 * RNF Validados: RNF-001 (Tiempo de respuesta), RNF-009 (Disponibilidad de flota)
 * 
 * Este test mide los tiempos de respuesta del flujo de verificación de disponibilidad
 * de autos y los compara con los umbrales definidos.
 * 
 * Requisitos:
 * - El backend debe estar corriendo en http://localhost:5001
 * - Base de datos debe tener autos de prueba
 */

const axios = require('axios');
const config = require('../config');
const fs = require('fs');
const path = require('path');

class DisponibilidadPerformanceTest {
  constructor() {
    this.results = [];
    this.apiUrl = config.API_BASE_URL;
    this.token = null;
    this.reportPath = path.join(__dirname, '../../resultados/disponibilidad-perf-report.json');
  }

  // Utilidad para medir tiempo
  async measureTime(fn) {
    const start = Date.now();
    const startHR = process.hrtime.bigint();
    
    await fn();
    
    const end = Date.now();
    const endHR = process.hrtime.bigint();
    
    return {
      ms: end - start,
      microseconds: Number(endHR - startHR) / 1000
    };
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
    this.log('Autenticando usuario de prueba...', 'info');

    const candidates = [
      {
        email: process.env.TEST_AUTH_EMAIL,
        contraseña: process.env.TEST_AUTH_PASSWORD
      },
      {
        email: 'admin@rentacar.com',
        contraseña: 'admin123'
      },
      {
        email: 'admin@test.com',
        contraseña: 'Admin1234'
      }
    ].filter((c) => c.email && c.contraseña);

    for (const credentials of candidates) {
      try {
        const response = await axios.post(`${this.apiUrl}/api/auth/login`, credentials);

        if (response.data.data?.token) {
          this.token = response.data.data.token;
          this.log(`Autenticación exitosa con ${credentials.email}`, 'success');
          return true;
        }
      } catch (error) {
        // Intenta con el siguiente candidato.
      }
    }

    this.log('No se pudo autenticar con las credenciales disponibles (401)', 'warning');
    this.log('Continuando tests sin autenticación...', 'info');
    return false;
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

  // Test 1: Verificación de disponibilidad global (GET /api/catalogo)
  async testDisponibilidadGlobal() {
    this.log('Test 1: Verificación de Disponibilidad Global (GET /api/catalogo)', 'header');
    
    try {
      const iterations = 15;
      const times = [];
      const responseMetrics = {
        statusCodes: {},
        autosCounts: []
      };

      for (let i = 0; i < iterations; i++) {
        const time = await this.measureTime(async () => {
          const response = await axios.get(`${this.apiUrl}/api/catalogo`, {
            headers: this.getHeaders()
          });
          
          responseMetrics.statusCodes[response.status] = (responseMetrics.statusCodes[response.status] || 0) + 1;
          if (Array.isArray(response.data.data)) {
            responseMetrics.autosCounts.push(response.data.data.length);
          }
        });
        times.push(time.ms);
        this.log(`  Iteración ${i + 1}/${iterations}: ${time.ms}ms (${time.microseconds.toFixed(0)}μs)`);
      }

      const avgTime = times.reduce((a, b) => a + b) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);
      const threshold = config.PERFORMANCE_THRESHOLDS.simpleQuery;
      const stdDev = Math.sqrt(times.reduce((sq, n) => sq + Math.pow(n - avgTime, 2), 0) / times.length);

      const result = {
        endpoint: 'GET /api/catalogo',
        tipo: 'Disponibilidad Global',
        avgTime: avgTime.toFixed(2),
        minTime,
        maxTime,
        stdDev: stdDev.toFixed(2),
        threshold,
        passed: avgTime <= threshold,
        rnf: 'RNF-001 (Tiempo respuesta), RNF-009 (Disponibilidad flota)',
        timestamp: new Date().toISOString(),
        responseMetrics
      };

      this.results.push(result);

      this.log(`\nResultados Estadísticos:`, 'info');
      this.log(`  Tiempo promedio: ${avgTime.toFixed(2)}ms`);
      this.log(`  Tiempo mínimo: ${minTime}ms`);
      this.log(`  Tiempo máximo: ${maxTime}ms`);
      this.log(`  Desv. Estándar: ${stdDev.toFixed(2)}ms`);
      this.log(`  Umbral: ${threshold}ms`);
      this.log(`  Autos encontrados (promedio): ${(responseMetrics.autosCounts.reduce((a,b)=>a+b,0)/responseMetrics.autosCounts.length).toFixed(0)}`);
      
      if (result.passed) {
        this.log(`  Estado: APROBADO ✓ (${(threshold - avgTime).toFixed(2)}ms por debajo del umbral)`, 'success');
      } else {
        this.log(`  Estado: FALLIDO ✗ (Excede umbral por ${(avgTime - threshold).toFixed(2)}ms)`, 'error');
      }

    } catch (error) {
      this.log(`Error en test: ${error.message}`, 'error');
      this.results.push({
        endpoint: 'GET /api/catalogo',
        tipo: 'Disponibilidad Global',
        error: error.message,
        passed: false,
        rnf: 'RNF-001, RNF-009'
      });
    }
  }

  // Test 2: Búsqueda de disponibilidad con filtros
  async testDisponibilidadConFiltros() {
    this.log('Test 2: Búsqueda de Disponibilidad con Filtros', 'header');
    
    try {
      const iterations = 10;
      const times = [];
      const filtros = [
        { disponible: true },
        { disponible: true, tipoCoche: 'SUV' },
        { disponible: true, marca: 'Toyota', precioMin: 30, precioMax: 80 }
      ];

      for (const filtro of filtros) {
        this.log(`\n  Ejecutando con filtros: ${JSON.stringify(filtro)}`, 'info');
        const filtroTimes = [];

        for (let i = 0; i < iterations; i++) {
          const params = new URLSearchParams(filtro);
          const time = await this.measureTime(async () => {
            await axios.get(`${this.apiUrl}/api/catalogo?${params.toString()}`, {
              headers: this.getHeaders()
            });
          });
          filtroTimes.push(time.ms);
        }

        const avgTime = filtroTimes.reduce((a, b) => a + b) / filtroTimes.length;
        const maxTime = Math.max(...filtroTimes);
        const minTime = Math.min(...filtroTimes);
        const threshold = config.PERFORMANCE_THRESHOLDS.complexQuery;

        const result = {
          endpoint: 'GET /api/catalogo',
          tipo: 'Disponibilidad con Filtros',
          filtros: filtro,
          avgTime: avgTime.toFixed(2),
          minTime,
          maxTime,
          threshold,
          passed: avgTime <= threshold,
          rnf: 'RNF-001, RNF-009'
        };

        this.results.push(result);

        this.log(`    Promedio: ${avgTime.toFixed(2)}ms | Umbral: ${threshold}ms | Estado: ${result.passed ? 'APROBADO ✓' : 'FALLIDO ✗'}`, 
                 result.passed ? 'success' : 'error');
      }

    } catch (error) {
      this.log(`Error en test: ${error.message}`, 'error');
    }
  }

  // Test 3: Búsqueda textual en catálogo
  async testBusquedaTexto() {
    this.log('Test 3: Búsqueda Textual de Disponibilidad (GET /api/catalogo/search)', 'header');
    
    try {
      const querys = ['Toyota', 'SUV', 'Gasolina'];
      
      for (const q of querys) {
        this.log(`\n  Buscando: "${q}"`, 'info');
        const times = [];
        const iterations = 10;

        for (let i = 0; i < iterations; i++) {
          const time = await this.measureTime(async () => {
            await axios.get(`${this.apiUrl}/api/catalogo/search?query=${q}&disponible=true`, {
              headers: this.getHeaders()
            });
          });
          times.push(time.ms);
        }

        const avgTime = times.reduce((a, b) => a + b) / times.length;
        const threshold = config.PERFORMANCE_THRESHOLDS.complexQuery;

        const result = {
          endpoint: 'GET /api/catalogo/search',
          tipo: 'Búsqueda Textual',
          query: q,
          avgTime: avgTime.toFixed(2),
          threshold,
          passed: avgTime <= threshold,
          rnf: 'RNF-001'
        };

        this.results.push(result);
        this.log(`    Promedio: ${avgTime.toFixed(2)}ms | Estado: ${result.passed ? 'APROBADO ✓' : 'FALLIDO ✗'}`, 
                 result.passed ? 'success' : 'error');
      }

    } catch (error) {
      this.log(`Error en test: ${error.message}`, 'error');
    }
  }

  // Generar reporte HTML
  generateHTMLReport() {
    const passedTests = this.results.filter(r => r.passed).length;
    const totalTests = this.results.length;
    const passRate = ((passedTests / totalTests) * 100).toFixed(2);

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte de Performance - Disponibilidad</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        h1 { color: #333; margin-bottom: 10px; }
        .timestamp { color: #999; font-size: 12px; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
        .summary-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
        .summary-card.success { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
        .summary-card.warning { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
        .summary-card h3 { font-size: 28px; margin-bottom: 5px; }
        .summary-card p { font-size: 12px; opacity: 0.9; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #f0f0f0; padding: 12px; text-align: left; font-weight: 600; color: #333; }
        td { padding: 12px; border-bottom: 1px solid #eee; }
        tr:hover { background: #fafafa; }
        .status-pass { color: #22c55e; font-weight: bold; }
        .status-fail { color: #ef4444; font-weight: bold; }
        .threshold-ok { color: #666; }
        .threshold-exceeded { color: #ef4444; font-weight: bold; }
        .chart { margin-top: 30px; padding: 20px; background: #f9f9f9; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📊 Reporte de Performance - Verificación de Disponibilidad</h1>
        <p class="timestamp">Generado: ${new Date().toLocaleString()}</p>
        
        <div class="summary">
            <div class="summary-card success">
                <h3>${passedTests}/${totalTests}</h3>
                <p>Tests Aprobados</p>
            </div>
            <div class="summary-card ${passRate >= 80 ? 'success' : 'warning'}">
                <h3>${passRate}%</h3>
                <p>Tasa de Aprobación</p>
            </div>
            <div class="summary-card">
                <h3>${this.results.filter(r => r.avgTime).reduce((sum, r) => sum + parseFloat(r.avgTime), 0).toFixed(0)}ms</h3>
                <p>Tiempo Promedio Total</p>
            </div>
            <div class="summary-card">
                <h3>${Math.max(...this.results.filter(r => r.avgTime).map(r => parseFloat(r.avgTime))).toFixed(0)}ms</h3>
                <p>Tiempo Máximo Registrado</p>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Endpoint</th>
                    <th>Tipo</th>
                    <th>Tiempo Promedio</th>
                    <th>Rango (Min-Max)</th>
                    <th>Umbral</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody>
                ${this.results.map(r => `
                    <tr>
                        <td><code>${r.endpoint || 'N/A'}</code></td>
                        <td>${r.tipo || 'N/A'}</td>
                        <td>${r.avgTime || r.error || 'N/A'}ms</td>
                        <td>${r.minTime ? `${r.minTime}-${r.maxTime}ms` : 'N/A'}</td>
                        <td><span class="${r.threshold && parseFloat(r.avgTime) > r.threshold ? 'threshold-exceeded' : 'threshold-ok'}">${r.threshold || 'N/A'}ms</span></td>
                        <td><span class="${r.passed ? 'status-pass' : 'status-fail'}">${r.passed ? '✓ APROBADO' : '✗ FALLIDO'}</span></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <div class="chart">
            <h3>📈 RNF Validados</h3>
            <ul style="margin-left: 20px; margin-top: 10px; line-height: 1.8;">
                <li><strong>RNF-001:</strong> Tiempo de respuesta de API ≤ 200ms (consultas simples), ≤ 500ms (complejas)</li>
                <li><strong>RNF-009:</strong> Disponibilidad de flota - verificación en tiempo real</li>
            </ul>
        </div>

        <div style="margin-top: 30px; padding: 20px; background: #e8f5e9; border-radius: 8px; border-left: 4px solid #4caf50;">
            <h3 style="color: #2e7d32; margin-bottom: 10px;">✓ Conclusión</h3>
            <p>Los tiempos de respuesta de verificación de disponibilidad ${passRate >= 80 ? '✓ cumplen' : '✗ NO cumplen'} con los requisitos de performance definidos en los RNF.</p>
        </div>
    </div>
</body>
</html>
    `;

    return html;
  }

  // Guardar reporte
  saveReport() {
    const jsonReport = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: this.results.length,
        passedTests: this.results.filter(r => r.passed).length,
        passRate: ((this.results.filter(r => r.passed).length / this.results.length) * 100).toFixed(2)
      },
      results: this.results
    };

    const reportDir = path.dirname(this.reportPath);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    fs.writeFileSync(this.reportPath, JSON.stringify(jsonReport, null, 2));
    this.log(`Reporte JSON guardado en: ${this.reportPath}`, 'success');

    // También guardar reporte HTML
    const htmlPath = this.reportPath.replace('.json', '.html');
    fs.writeFileSync(htmlPath, this.generateHTMLReport());
    this.log(`Reporte HTML guardado en: ${htmlPath}`, 'success');
  }

  // Ejecutar todos los tests
  async runAllTests() {
    this.log('Iniciando suite de tests de performance - Verificación de Disponibilidad', 'header');
    
    const apiReachable = await this.checkAPIConnection();
    if (!apiReachable) {
      this.log('No se puede alcanzar la API. Verifica que el backend esté corriendo.', 'error');
      return;
    }

    await this.authenticate();
    
    await this.testDisponibilidadGlobal();
    await this.testDisponibilidadConFiltros();
    await this.testBusquedaTexto();

    this.log('', 'header');
    this.log('Suite de tests completada', 'header');
    
    const passedTests = this.results.filter(r => r.passed).length;
    this.log(`Resumen Final: ${passedTests}/${this.results.length} tests aprobados`, 
             passedTests === this.results.length ? 'success' : 'warning');
    
    this.saveReport();
  }

  // Verificar conexión a API
  async checkAPIConnection() {
    const healthEndpoints = ['/api/health', '/api/catalogo'];

    for (const endpoint of healthEndpoints) {
      try {
        await axios.get(`${this.apiUrl}${endpoint}`, { timeout: 5000 });
        this.log(`Conexión a API establecida: ${this.apiUrl}${endpoint}`, 'success');
        return true;
      } catch (error) {
        // Intenta el siguiente endpoint hasta encontrar uno disponible.
      }
    }

    return false;
  }
}

// Ejecutar tests
const tester = new DisponibilidadPerformanceTest();
tester.runAllTests().catch(error => {
  console.error('Error fatal:', error);
  process.exit(1);
});
