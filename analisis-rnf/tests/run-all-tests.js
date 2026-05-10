/**
 * Script principal para ejecutar todos los tests de RNF
 * Genera un reporte consolidado con todos los resultados
 */

const fs = require('fs');
const path = require('path');
const config = require('./config');

// Importar clases de tests
const APIPerformanceTest = require('./performance/api-response-time.test');
const AuthTest = require('./security/auth.test');

class RNFTestRunner {
  constructor() {
    this.allResults = {
      timestamp: new Date().toISOString(),
      apiUrl: config.API_BASE_URL,
      tests: {},
      summary: {}
    };
  }

  log(message, type = 'info') {
    const colors = config.COLORS;
    
    switch(type) {
      case 'success':
        console.log(`${colors.GREEN}${message}${colors.RESET}`);
        break;
      case 'error':
        console.log(`${colors.RED}${message}${colors.RESET}`);
        break;
      case 'warning':
        console.log(`${colors.YELLOW}${message}${colors.RESET}`);
        break;
      case 'header':
        console.log(`\n${colors.CYAN}${'='.repeat(80)}`);
        console.log(`${message}`);
        console.log(`${'='.repeat(80)}${colors.RESET}\n`);
        break;
      default:
        console.log(`${colors.BLUE}${message}${colors.RESET}`);
    }
  }

  async checkServerAvailability() {
    this.log('Verificando disponibilidad del servidor...', 'info');
    
    const axios = require('axios');
    try {
      const response = await axios.get(config.API_BASE_URL, { timeout: 5000 });
      this.log(`✓ Servidor disponible: ${config.API_BASE_URL}`, 'success');
      return true;
    } catch (error) {
      this.log(`✗ Servidor NO disponible: ${config.API_BASE_URL}`, 'error');
      this.log(`  Error: ${error.message}`, 'error');
      this.log(`\nPor favor, asegúrese de que el backend esté ejecutándose antes de continuar.`, 'warning');
      this.log(`Puede iniciarlo con: cd ../rentacar/back && npm start\n`, 'info');
      return false;
    }
  }

  async runAllTests() {
    this.log('EJECUTOR DE TESTS DE REQUISITOS NO FUNCIONALES (RNF)', 'header');
    this.log(`Fecha y hora: ${new Date().toLocaleString()}`, 'info');
    this.log(`API Base URL: ${config.API_BASE_URL}`, 'info');

    // Verificar servidor
    const serverAvailable = await this.checkServerAvailability();
    if (!serverAvailable) {
      this.log('\n⚠️  ADVERTENCIA: Servidor no disponible', 'warning');
      this.log('Se ejecutarán solo los tests que no requieran el servidor.', 'warning');
      this.log('Para resultados completos, inicie el backend y vuelva a ejecutar.\n', 'info');
      
      // Preguntar si desea continuar
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise(resolve => {
        readline.question('¿Desea continuar de todos modos? (s/n): ', resolve);
      });
      
      readline.close();

      if (answer.toLowerCase() !== 's') {
        this.log('Ejecución cancelada por el usuario.', 'info');
        process.exit(0);
      }
    }

    // 1. Tests de Performance
    this.log('\n\n>>> CATEGORÍA: TESTS DE PERFORMANCE (RNF-001, RNF-003, RNF-004, RNF-005)', 'header');
    
    if (serverAvailable) {
      try {
        this.log('Ejecutando: API Response Time Test...', 'info');
        const perfTest = new APIPerformanceTest();
        this.allResults.tests.performance_api = await perfTest.runAll();
        this.log('✓ API Response Time Test completado', 'success');
      } catch (error) {
        this.log(`✗ Error en API Response Time Test: ${error.message}`, 'error');
        this.allResults.tests.performance_api = { error: error.message };
      }

      // Load Test requiere autocannon, que puede no estar instalado
      try {
        this.log('\nEjecutando: Load Test (requiere autocannon)...', 'info');
        this.log('NOTA: Load test omitido en esta versión (requiere autocannon)', 'warning');
        this.log('Para ejecutarlo: npm install autocannon && node performance/load-test.js', 'info');
      } catch (error) {
        this.log(`✗ Error en Load Test: ${error.message}`, 'error');
      }

      // Memory Leak Test
      try {
        this.log('\nEjecutando: Memory Leak Detection...', 'info');
        this.log('NOTA: Para mejores resultados, ejecutar con: node --expose-gc', 'info');
        this.log('Memory leak test omitido en ejecución automática (muy intensivo)', 'warning');
        this.log('Para ejecutarlo: node --expose-gc performance/memory-leak.test.js', 'info');
      } catch (error) {
        this.log(`✗ Error en Memory Leak Test: ${error.message}`, 'error');
      }
    } else {
      this.log('⊘ Tests de performance omitidos (servidor no disponible)', 'warning');
    }

    // 2. Tests de Seguridad
    this.log('\n\n>>> CATEGORÍA: TESTS DE SEGURIDAD (RNF-018, RNF-019, RNF-020)', 'header');
    
    if (serverAvailable) {
      try {
        this.log('Ejecutando: Authentication & Authorization Test...', 'info');
        const authTest = new AuthTest();
        this.allResults.tests.security_auth = await authTest.runAll();
        this.log('✓ Authentication & Authorization Test completado', 'success');
      } catch (error) {
        this.log(`✗ Error en Auth Test: ${error.message}`, 'error');
        this.allResults.tests.security_auth = { error: error.message };
      }
    } else {
      this.log('⊘ Tests de seguridad omitidos (servidor no disponible)', 'warning');
    }

    // 3. Tests de Compatibilidad
    this.log('\n\n>>> CATEGORÍA: TESTS DE COMPATIBILIDAD (RNF-008)', 'header');
    this.log('Tests de compatibilidad: requieren ejecución manual', 'info');
    this.log('- Compatibilidad de navegadores (RNF-006, RNF-007): Testing manual', 'info');
    this.log('- REST API Compliance (RNF-008): Verificado en auth tests', 'info');

    // 4. Tests de Fiabilidad
    this.log('\n\n>>> CATEGORÍA: TESTS DE FIABILIDAD (RNF-015, RNF-017)', 'header');
    this.log('Tests de fiabilidad: integrados en otros tests', 'info');
    this.log('- Error handling: verificado en auth tests', 'info');
    this.log('- Data integrity: requiere tests específicos de BD', 'info');

    // Generar reporte consolidado
    return this.generateConsolidatedReport();
  }

  generateConsolidatedReport() {
    this.log('\n\nGENERANDO REPORTE CONSOLIDADO...', 'header');

    // Calcular estadísticas generales
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;

    Object.entries(this.allResults.tests).forEach(([category, result]) => {
      if (result && !result.error) {
        totalTests += result.total || 0;
        passedTests += result.passed || 0;
        failedTests += result.failed || 0;
      }
    });

    const successRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(2) : 0;

    this.allResults.summary = {
      totalTests,
      passedTests,
      failedTests,
      successRate: `${successRate}%`,
      categoriesTested: Object.keys(this.allResults.tests).length,
      timestamp: new Date().toISOString()
    };

    // Mostrar resumen
    this.log('RESUMEN GENERAL DE TESTS', 'header');
    console.log('\n');
    console.table([{
      'Total Tests': totalTests,
      'Aprobados': passedTests,
      'Fallidos': failedTests,
      'Tasa de Éxito': `${successRate}%`,
      'Categorías': Object.keys(this.allResults.tests).length
    }]);

    this.log(`\nDesglose por Categoría:`, 'info');
    Object.entries(this.allResults.tests).forEach(([category, result]) => {
      if (result && !result.error) {
        const rate = result.total > 0 ? ((result.passed / result.total) * 100).toFixed(2) : 0;
        this.log(`  ${category}: ${result.passed}/${result.total} (${rate}%)`, 
                  rate >= 80 ? 'success' : rate >= 60 ? 'warning' : 'error');
      } else if (result && result.error) {
        this.log(`  ${category}: ERROR - ${result.error}`, 'error');
      }
    });

    // Evaluación final
    this.log(`\n\nEVALUACIÓN FINAL:`, 'header');
    
    if (successRate >= 90) {
      this.log(`✓ EXCELENTE (${successRate}%) - El sistema cumple con los RNF`, 'success');
    } else if (successRate >= 75) {
      this.log(`⚠ BUENO (${successRate}%) - El sistema cumple mayormente con los RNF`, 'success');
      this.log(`  Hay áreas de mejora identificadas`, 'warning');
    } else if (successRate >= 60) {
      this.log(`⚠ ACEPTABLE (${successRate}%) - El sistema necesita mejoras`, 'warning');
      this.log(`  Se recomienda abordar los tests fallidos`, 'warning');
    } else if (successRate > 0) {
      this.log(`✗ DEFICIENTE (${successRate}%) - El sistema tiene problemas significativos`, 'error');
      this.log(`  Se requieren mejoras urgentes`, 'error');
    } else {
      this.log(`⊘ SIN RESULTADOS - No se pudieron ejecutar los tests`, 'warning');
      this.log(`  Verifique que el servidor backend esté ejecutándose`, 'info');
    }

    return this.allResults;
  }

  async saveResults() {
    const resultsDir = path.join(__dirname, '../resultados');
    
    // Crear directorio si no existe
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    // Guardar JSON completo
    const jsonPath = path.join(resultsDir, 'rnf-test-results-complete.json');
    fs.writeFileSync(jsonPath, JSON.stringify(this.allResults, null, 2));
    this.log(`\n✓ Resultados JSON guardados en: ${jsonPath}`, 'success');

    // Generar reporte Markdown
    const mdReport = this.generateMarkdownReport();
    const mdPath = path.join(resultsDir, 'rnf-test-results-report.md');
    fs.writeFileSync(mdPath, mdReport);
    this.log(`✓ Reporte Markdown guardado en: ${mdPath}`, 'success');

    this.log(`\n📊 Archivos generados:`, 'info');
    this.log(`   - ${jsonPath}`, 'info');
    this.log(`   - ${mdPath}`, 'info');
  }

  generateMarkdownReport() {
    const s = this.allResults.summary;
    const successRate = parseFloat(s.successRate);

    let statusEmoji = '✅';
    let statusText = 'EXCELENTE';
    let statusColor = 'green';

    if (successRate < 90) {
      statusEmoji = '⚠️';
      statusText = 'BUENO';
      statusColor = 'yellow';
    }
    if (successRate < 75) {
      statusEmoji = '⚠️';
      statusText = 'ACEPTABLE';
      statusColor = 'orange';
    }
    if (successRate < 60 && successRate > 0) {
      statusEmoji = '❌';
      statusText = 'DEFICIENTE';
      statusColor = 'red';
    }
    if (successRate === 0) {
      statusEmoji = '⊘';
      statusText = 'SIN RESULTADOS';
      statusColor = 'gray';
    }

    return `# 📋 REPORTE DE TESTS DE REQUISITOS NO FUNCIONALES (RNF)
## Sistema RentaCar

**Fecha de Ejecución:** ${new Date(this.allResults.timestamp).toLocaleString()}  
**API URL:** ${this.allResults.apiUrl}  
**Estado General:** ${statusEmoji} **${statusText}** (${s.successRate})

---

## 📊 Resumen Ejecutivo

| Métrica | Valor |
|---------|-------|
| **Total de Tests Ejecutados** | ${s.totalTests} |
| **Tests Aprobados** | ${s.passedTests} ✅ |
| **Tests Fallidos** | ${s.failedTests} ❌ |
| **Tasa de Éxito** | ${s.successRate} |
| **Categorías Evaluadas** | ${s.categoriesTested} |

---

## 🎯 Resultados por Categoría

${Object.entries(this.allResults.tests).map(([category, result]) => {
  if (result && !result.error) {
    const rate = result.total > 0 ? ((result.passed / result.total) * 100).toFixed(2) : 0;
    const emoji = rate >= 80 ? '✅' : rate >= 60 ? '⚠️' : '❌';
    
    return `### ${emoji} ${category.replace(/_/g, ' ').toUpperCase()}

- **Tests:** ${result.total}
- **Aprobados:** ${result.passed}
- **Fallidos:** ${result.failed}
- **Tasa:** ${rate}%

${result.results ? '**Detalles:**\n' + result.results.map(r => 
  `- ${r.passed ? '✅' : '❌'} ${r.test || r.endpoint || r.name}: ${r.passed ? 'PASS' : 'FAIL'} (${r.rnf})`
).join('\n') : ''}
`;
  } else if (result && result.error) {
    return `### ❌ ${category.replace(/_/g, ' ').toUpperCase()}

- **Error:** ${result.error}
`;
  }
  return '';
}).join('\n---\n\n')}

---

## 🔍 Análisis de Cumplimiento de RNF

### Características Evaluadas (ISO/IEC 25010)

| Característica | RNF Evaluados | Estado |
|----------------|---------------|--------|
| **Eficiencia de Desempeño** | RNF-001, RNF-003, RNF-004, RNF-005 | ${this.allResults.tests.performance_api ? (this.allResults.tests.performance_api.percentage >= 75 ? '✅ Cumple' : '⚠️ Parcial') : '⊘ No evaluado'} |
| **Seguridad** | RNF-018, RNF-019, RNF-020 | ${this.allResults.tests.security_auth ? (this.allResults.tests.security_auth.percentage >= 75 ? '✅ Cumple' : '⚠️ Parcial') : '⊘ No evaluado'} |
| **Compatibilidad** | RNF-006, RNF-007, RNF-008 | ⊘ Requiere testing manual |
| **Fiabilidad** | RNF-014, RNF-015, RNF-016, RNF-017 | ⊘ Requiere testing adicional |
| **Mantenibilidad** | RNF-023, RNF-024, RNF-025, RNF-026 | ⊘ Requiere análisis de código |
| **Portabilidad** | RNF-027, RNF-028, RNF-029 | ⊘ Requiere testing en múltiples entornos |

---

## 📌 Conclusiones

${successRate >= 90 ? `
El sistema **CUMPLE EXCELENTEMENTE** con los Requisitos No Funcionales evaluados. 
- ✅ Nivel de calidad alto
- ✅ Listo para producción en aspectos evaluados
- 💡 Continuar con tests de categorías pendientes
` : successRate >= 75 ? `
El sistema **CUMPLE** con los Requisitos No Funcionales evaluados, con oportunidades de mejora.
- ✅ Nivel de calidad aceptable
- ⚠️ Existen áreas de mejora identificadas
- 💡 Revisar tests fallidos antes de producción
` : successRate >= 60 ? `
El sistema **CUMPLE PARCIALMENTE** con los Requisitos No Funcionales.
- ⚠️ Se requieren mejoras
- ❌ Varios tests fallidos requieren atención
- 💡 Priorizar correcciones antes de producción
` : successRate > 0 ? `
El sistema **NO CUMPLE** adecuadamente con los Requisitos No Funcionales.
- ❌ Problemas significativos identificados
- ⚠️ NO recomendado para producción
- 💡 Se requieren mejoras urgentes
` : `
**NO SE PUDIERON EJECUTAR LOS TESTS**
- ⊘ Servidor backend no disponible
- 💡 Inicie el backend y vuelva a ejecutar: \`cd rentacar/back && npm start\`
`}

---

## 🛠 Recomendaciones

### Inmediatas (Alta Prioridad)
${s.failedTests > 0 ? `
1. **Corregir tests fallidos:** ${s.failedTests} tests requieren atención
2. **Revisar logs de errores** en los resultados JSON completos
3. **Implementar mejoras** según análisis del informe principal
` : `
1. ✅ No se identificaron problemas críticos
2. Continuar con testing de categorías pendientes
3. Mantener código actualizado y documentado
`}

### Corto Plazo
1. Completar tests de **Compatibilidad** (navegadores, dispositivos)
2. Implementar tests de **Fiabilidad** (error handling, backups)
3. Configurar **CI/CD** para tests automatizados

### Largo Plazo
1. Implementar **monitoring** en producción
2. Establecer **SLAs** basados en RNF
3. Auditorías periódicas de calidad

---

## 📂 Archivos Relacionados

- **Informe Completo:** \`INFORME_RNF_SISTEMA_RENTACAR.md\`
- **Resultados JSON:** \`rnf-test-results-complete.json\`
- **Scripts de Tests:** Carpeta \`tests/\`

---

*Reporte generado automáticamente por RNF Test Runner v1.0*  
*Sistema de Gestión de Alquiler de Vehículos - RentaCar*
`;
  }
}

// Ejecutar
async function main() {
  const runner = new RNFTestRunner();
  
  try {
    await runner.runAllTests();
    await runner.saveResults();
    
    const successRate = parseFloat(runner.allResults.summary.successRate);
    process.exit(successRate >= 75 ? 0 : 1);
  } catch (error) {
    console.error('\n❌ Error fatal en la ejecución de tests:');
    console.error(error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = RNFTestRunner;
