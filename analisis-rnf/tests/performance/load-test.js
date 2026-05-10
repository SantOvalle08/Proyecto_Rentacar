/**
 * TEST-002: Load Testing - Usuarios Concurrentes
 * RNF Validados: RNF-003 (Capacidad usuarios concurrentes), RNF-004 (Utilización de recursos)
 * 
 * Este test simula múltiples usuarios concurrentes accediendo a la API
 * y mide el rendimiento del sistema bajo carga.
 */

const autocannon = require('autocannon');
const config = require('../config');

class LoadTest {
  constructor() {
    this.apiUrl = config.API_BASE_URL;
    this.results = [];
  }

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

  // Test con N usuarios concurrentes
  async runLoadTest(connections, duration = 30) {
    this.log(`Test de Carga: ${connections} usuarios concurrentes`, 'header');
    this.log(`Duración: ${duration} segundos`, 'info');
    this.log(`Target: GET /api/autos`, 'info');

    return new Promise((resolve) => {
      const instance = autocannon({
        url: `${this.apiUrl}/api/autos`,
        connections: connections,
        duration: duration,
        pipelining: 1
      }, (err, result) => {
        if (err) {
          this.log(`Error en test: ${err.message}`, 'error');
          resolve(null);
          return;
        }

        const summary = {
          connections,
          duration,
          requests: {
            total: result.requests.total,
            average: result.requests.average,
            mean: result.requests.mean,
            stddev: result.requests.stddev,
            min: result.requests.min,
            max: result.requests.max
          },
          latency: {
            average: result.latency.mean,
            mean: result.latency.mean,
            stddev: result.latency.stddev,
            min: result.latency.min,
            max: result.latency.max,
            p50: result.latency.p50,
            p95: result.latency.p95,
            p99: result.latency.p99
          },
          throughput: {
            average: result.throughput.average,
            mean: result.throughput.mean,
            stddev: result.throughput.stddev,
            min: result.throughput.min,
            max: result.throughput.max
          },
          errors: result.errors,
          timeouts: result.timeouts,
          non2xx: result.non2xx || 0
        };

        this.log(`\nResultados:`, 'info');
        this.log(`  Total de requests: ${summary.requests.total}`, 'info');
        this.log(`  Requests/segundo: ${summary.requests.average.toFixed(2)}`, 'info');
        this.log(`  Latencia promedio: ${summary.latency.average.toFixed(2)}ms`, 'info');
        this.log(`  Latencia P95: ${summary.latency.p95}ms`, 'info');
        this.log(`  Latencia P99: ${summary.latency.p99}ms`, 'info');
        this.log(`  Errores: ${summary.errors}`, summary.errors === 0 ? 'success' : 'error');
        this.log(`  Timeouts: ${summary.timeouts}`, summary.timeouts === 0 ? 'success' : 'warning');
        this.log(`  Respuestas non-2xx: ${summary.non2xx}`, summary.non2xx === 0 ? 'success' : 'warning');

        // Criterios de aceptación RNF-003
        const errorRate = ((summary.errors + summary.non2xx) / summary.requests.total) * 100;
        const passed = summary.errors === 0 && 
                      summary.timeouts === 0 && 
                      errorRate < 1 && 
                      summary.latency.p95 < 1000; // P95 < 1s bajo carga

        summary.errorRate = errorRate.toFixed(2);
        summary.passed = passed;
        summary.rnf = 'RNF-003';

        if (passed) {
          this.log(`  Estado: APROBADO ✓`, 'success');
        } else {
          this.log(`  Estado: FALLIDO ✗`, 'error');
          if (summary.errors > 0) this.log(`    - Tiene ${summary.errors} errores`, 'error');
          if (summary.timeouts > 0) this.log(`    - Tiene ${summary.timeouts} timeouts`, 'error');
          if (errorRate >= 1) this.log(`    - Error rate ${errorRate}% >= 1%`, 'error');
          if (summary.latency.p95 >= 1000) this.log(`    - Latencia P95 ${summary.latency.p95}ms >= 1000ms`, 'error');
        }

        this.results.push(summary);
        resolve(summary);
      });

      // Progress tracking
      autocannon.track(instance, { renderProgressBar: true });
    });
  }

  // Ejecutar tests con múltiples niveles de carga
  async runAll() {
    this.log('INICIANDO TESTS DE CARGA (LOAD TESTING)', 'header');
    this.log(`API URL: ${this.apiUrl}`, 'info');
    this.log(`Fecha: ${new Date().toISOString()}`, 'info');

    const loadLevels = [
      { connections: 10, duration: 15, name: 'Carga Baja' },
      { connections: 50, duration: 20, name: 'Carga Media' },
      { connections: 100, duration: 30, name: 'Carga Alta (Target RNF-003)' }
    ];

    for (const level of loadLevels) {
      this.log(`\n>> Ejecutando: ${level.name}`, 'info');
      await this.runLoadTest(level.connections, level.duration);
      
      // Esperar 5 segundos entre tests para que el servidor se recupere
      if (loadLevels.indexOf(level) < loadLevels.length - 1) {
        this.log('Esperando 5 segundos antes del siguiente test...', 'info');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    return this.generateReport();
  }

  generateReport() {
    this.log('REPORTE FINAL - LOAD TESTING', 'header');

    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    const percentage = ((passed / total) * 100).toFixed(2);

    console.log('\n=== Resumen por Nivel de Carga ===\n');
    
    this.results.forEach((result, index) => {
      const levelNames = ['Carga Baja (10)', 'Carga Media (50)', 'Carga Alta (100)'];
      console.log(`\n${levelNames[index]}:`);
      console.log(`  Requests totales: ${result.requests.total}`);
      console.log(`  Req/segundo: ${result.requests.average.toFixed(2)}`);
      console.log(`  Latencia promedio: ${result.latency.average.toFixed(2)}ms`);
      console.log(`  Latencia P95: ${result.latency.p95}ms`);
      console.log(`  Latencia P99: ${result.latency.p99}ms`);
      console.log(`  Error rate: ${result.errorRate}%`);
      console.log(`  Estado: ${result.passed ? '✓ PASS' : '✗ FAIL'}`);
    });

    this.log(`\n\nResumen General:`, 'info');
    this.log(`  Tests ejecutados: ${total}`);
    this.log(`  Tests aprobados: ${passed}`, passed === total ? 'success' : 'warning');
    this.log(`  Tests fallidos: ${total - passed}`, total - passed === 0 ? 'success' : 'error');
    this.log(`  Porcentaje de éxito: ${percentage}%`, percentage >= 80 ? 'success' : 'error');

    // Análisis RNF-003
    const highLoadResult = this.results[2]; // 100 usuarios
    if (highLoadResult) {
      this.log(`\n\nAnálisis RNF-003 (100 usuarios concurrentes):`, 'info');
      
      if (highLoadResult.passed) {
        this.log(`  ✓ El sistema soporta 100+ usuarios concurrentes`, 'success');
        this.log(`  ✓ Latencia P95 bajo 1 segundo: ${highLoadResult.latency.p95}ms`, 'success');
        this.log(`  ✓ Sin errores significativos (${highLoadResult.errorRate}%)`, 'success');
        this.log(`\n  CONCLUSIÓN: RNF-003 CUMPLIDO`, 'success');
      } else {
        this.log(`  ✗ El sistema tiene problemas con 100 usuarios`, 'error');
        if (highLoadResult.latency.p95 >= 1000) {
          this.log(`  ✗ Latencia P95 muy alta: ${highLoadResult.latency.p95}ms`, 'error');
        }
        if (parseFloat(highLoadResult.errorRate) >= 1) {
          this.log(`  ✗ Error rate inaceptable: ${highLoadResult.errorRate}%`, 'error');
        }
        this.log(`\n  CONCLUSIÓN: RNF-003 NO CUMPLIDO`, 'error');
        this.log(`  RECOMENDACIÓN: Optimizar backend, agregar caching`, 'warning');
      }
    }

    return {
      total,
      passed,
      failed: total - passed,
      percentage,
      results: this.results,
      rnf003_compliant: highLoadResult ? highLoadResult.passed : false
    };
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const test = new LoadTest();
  test.runAll()
    .then(report => {
      const fs = require('fs');
      const outputPath = '../resultados/load-test-results.json';
      fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
      console.log(`\nResultados guardados en: ${outputPath}`);
      
      process.exit(report.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Error fatal:', error);
      process.exit(1);
    });
}

module.exports = LoadTest;
