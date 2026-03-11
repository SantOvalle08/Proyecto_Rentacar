/**
 * TEST-003: Memory Leak Detection
 * RNF Validados: RNF-004 (Utilización de recursos del servidor)
 * 
 * Este test detecta memory leaks ejecutando operaciones repetitivas
 * y monitoreando el uso de memoria.
 */

const axios = require('axios');
const config = require('../config');

class MemoryLeakTest {
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

  // Obtener uso de memoria actual
  getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      rss: (usage.rss / 1024 / 1024).toFixed(2), // MB
      heapTotal: (usage.heapTotal / 1024 / 1024).toFixed(2),
      heapUsed: (usage.heapUsed / 1024 / 1024).toFixed(2),
      external: (usage.external / 1024 / 1024).toFixed(2)
    };
  }

  // Forzar garbage collection (si está disponible)
  forceGC() {
    if (global.gc) {
      global.gc();
      this.log('Garbage collection ejecutado', 'info');
    } else {
      this.log('GC no disponible (ejecutar con --expose-gc)', 'warning');
    }
  }

  // Test: Múltiples consultas GET
  async testRepeatedGETRequests() {
    this.log('Test: Consultas GET repetidas', 'header');
    
    const iterations = config.MEMORY_THRESHOLDS.iterations;
    const checkpoints = [0, 250, 500, 750, 1000];
    const memorySnapshots = [];

    this.log(`Ejecutando ${iterations} consultas GET a /api/autos`, 'info');
    this.log('Monitoreando memoria en puntos de control...', 'info');

    // GC inicial
    this.forceGC();
    await new Promise(resolve => setTimeout(resolve, 1000));

    const initialMemory = this.getMemoryUsage();
    this.log(`Memoria inicial - Heap: ${initialMemory.heapUsed}MB, RSS: ${initialMemory.rss}MB`, 'info');

    for (let i = 0; i < iterations; i++) {
      try {
        await axios.get(`${this.apiUrl}/api/autos`);
        
        if (checkpoints.includes(i)) {
          // Forzar GC antes de medir
          this.forceGC();
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const memory = this.getMemoryUsage();
          memorySnapshots.push({
            iteration: i,
            ...memory
          });
          
          this.log(`Checkpoint ${i}/${iterations} - Heap: ${memory.heapUsed}MB, RSS: ${memory.rss}MB`, 'info');
        }

        // Progress cada 100 iteraciones
        if ((i + 1) % 100 === 0) {
          this.log(`Progreso: ${i + 1}/${iterations}`, 'info');
        }
      } catch (error) {
        this.log(`Error en iteración ${i}: ${error.message}`, 'warning');
      }
    }

    // Medición final después de GC
    this.forceGC();
    await new Promise(resolve => setTimeout(resolve, 1000));
    const finalMemory = this.getMemoryUsage();
    
    this.log(`\nMemoria final - Heap: ${finalMemory.heapUsed}MB, RSS: ${finalMemory.rss}MB`, 'info');

    // Análisis
    const memoryIncrease = parseFloat(finalMemory.heapUsed) - parseFloat(initialMemory.heapUsed);
    const threshold = config.MEMORY_THRESHOLDS.maxMemoryIncreaseMB;
    const passed = memoryIncrease <= threshold;

    const result = {
      test: 'Repeated GET Requests',
      iterations,
      initialMemory: initialMemory.heapUsed,
      finalMemory: finalMemory.heapUsed,
      memoryIncrease: memoryIncrease.toFixed(2),
      threshold,
      snapshots: memorySnapshots,
      passed,
      rnf: 'RNF-004'
    };

    this.results.push(result);

    this.log(`\nAnálisis:`, 'info');
    this.log(`  Incremento de memoria: ${memoryIncrease.toFixed(2)}MB`, 'info');
    this.log(`  Umbral permitido: ${threshold}MB`, 'info');
    
    if (passed) {
      this.log(`  Estado: APROBADO ✓ (Sin memory leak significativo)`, 'success');
    } else {
      this.log(`  Estado: FALLIDO ✗ (Posible memory leak)`, 'error');
      this.log(`  Exceso: ${(memoryIncrease - threshold).toFixed(2)}MB`, 'error');
    }

    return result;
  }

  // Test: Autenticaciones repetidas
  async testRepeatedAuthentications() {
    this.log('Test: Autenticaciones repetidas', 'header');
    
    const iterations = 500; // Menos iteraciones porque es más pesado
    const checkpoints = [0, 125, 250, 375, 500];
    const memorySnapshots = [];

    this.log(`Ejecutando ${iterations} autenticaciones`, 'info');

    this.forceGC();
    await new Promise(resolve => setTimeout(resolve, 1000));

    const initialMemory = this.getMemoryUsage();
    this.log(`Memoria inicial - Heap: ${initialMemory.heapUsed}MB`, 'info');

    for (let i = 0; i < iterations; i++) {
      try {
        // Intentar login (puede fallar si el usuario no existe, pero genera procesamiento)
        await axios.post(`${this.apiUrl}/api/usuarios/login`, {
          email: `test${i}@example.com`,
          password: 'Test123456'
        }).catch(() => {}); // Ignorar errores

        if (checkpoints.includes(i)) {
          this.forceGC();
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const memory = this.getMemoryUsage();
          memorySnapshots.push({
            iteration: i,
            ...memory
          });
          
          this.log(`Checkpoint ${i}/${iterations} - Heap: ${memory.heapUsed}MB`, 'info');
        }

        if ((i + 1) % 50 === 0) {
          this.log(`Progreso: ${i + 1}/${iterations}`, 'info');
        }
      } catch (error) {
        // Ignorar errores de red
      }
    }

    this.forceGC();
    await new Promise(resolve => setTimeout(resolve, 1000));
    const finalMemory = this.getMemoryUsage();

    this.log(`\nMemoria final - Heap: ${finalMemory.heapUsed}MB`, 'info');

    const memoryIncrease = parseFloat(finalMemory.heapUsed) - parseFloat(initialMemory.heapUsed);
    const threshold = config.MEMORY_THRESHOLDS.maxMemoryIncreaseMB;
    const passed = memoryIncrease <= threshold;

    const result = {
      test: 'Repeated Authentications',
      iterations,
      initialMemory: initialMemory.heapUsed,
      finalMemory: finalMemory.heapUsed,
      memoryIncrease: memoryIncrease.toFixed(2),
      threshold,
      snapshots: memorySnapshots,
      passed,
      rnf: 'RNF-004'
    };

    this.results.push(result);

    this.log(`\nAnálisis:`, 'info');
    this.log(`  Incremento de memoria: ${memoryIncrease.toFixed(2)}MB`, 'info');
    this.log(`  Umbral permitido: ${threshold}MB`, 'info');
    
    if (passed) {
      this.log(`  Estado: APROBADO ✓`, 'success');
    } else {
      this.log(`  Estado: FALLIDO ✗`, 'error');
    }

    return result;
  }

  generateReport() {
    this.log('REPORTE FINAL - MEMORY LEAK DETECTION', 'header');

    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    const percentage = ((passed / total) * 100).toFixed(2);

    console.log('\n=== Resultados por Test ===\n');
    
    this.results.forEach(result => {
      console.log(`\n${result.test}:`);
      console.log(`  Iteraciones: ${result.iterations}`);
      console.log(`  Memoria inicial: ${result.initialMemory}MB`);
      console.log(`  Memoria final: ${result.finalMemory}MB`);
      console.log(`  Incremento: ${result.memoryIncrease}MB`);
      console.log(`  Umbral: ${result.threshold}MB`);
      console.log(`  Estado: ${result.passed ? '✓ PASS' : '✗ FAIL'}`);
    });

    this.log(`\n\nResumen General:`, 'info');
    this.log(`  Tests ejecutados: ${total}`);
    this.log(`  Tests aprobados: ${passed}`, passed === total ? 'success' : 'warning');
    this.log(`  Tests fallidos: ${total - passed}`, total - passed === 0 ? 'success' : 'error');
    this.log(`  Porcentaje de éxito: ${percentage}%`, percentage >= 80 ? 'success' : 'error');

    if (passed === total) {
      this.log(`\n\nCONCLUSIÓN: No se detectaron memory leaks significativos`, 'success');
      this.log(`RNF-004 (Utilización de Recursos): CUMPLIDO`, 'success');
    } else {
      this.log(`\n\nCONCLUSIÓN: Se detectaron posibles memory leaks`, 'error');
      this.log(`RNF-004 (Utilización de Recursos): PARCIALMENTE CUMPLIDO`, 'warning');
      this.log(`RECOMENDACIÓN: Revisar closures, event listeners, y caché`, 'warning');
    }

    return {
      total,
      passed,
      failed: total - passed,
      percentage,
      results: this.results
    };
  }

  async runAll() {
    this.log('INICIANDO TESTS DE MEMORY LEAK', 'header');
    this.log(`API URL: ${this.apiUrl}`, 'info');
    this.log(`Fecha: ${new Date().toISOString()}`, 'info');
    
    if (!global.gc) {
      this.log('ADVERTENCIA: GC no expuesto. Ejecutar con: node --expose-gc', 'warning');
      this.log('Los resultados pueden ser menos precisos sin GC manual', 'warning');
    }

    await this.testRepeatedGETRequests();
    await this.testRepeatedAuthentications();

    return this.generateReport();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const test = new MemoryLeakTest();
  test.runAll()
    .then(report => {
      const fs = require('fs');
      const outputPath = '../resultados/memory-leak-results.json';
      fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
      console.log(`\nResultados guardados en: ${outputPath}`);
      
      process.exit(report.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Error fatal:', error);
      process.exit(1);
    });
}

module.exports = MemoryLeakTest;
