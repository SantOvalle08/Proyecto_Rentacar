/**
 * TEST-RNF23: Recuperacion ante fallos transitorios
 * RNF Validado: RNF-23 (Operacion del Sistema - recuperacion/fallback)
 *
 * Estrategia:
 * - Operacion bajo prueba: GET /api/catalogo
 * - Falla transitoria simulada: timeout controlado en los primeros N intentos
 * - Recuperacion esperada: reintentos con backoff hasta obtener respuesta exitosa
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const config = require('../config');

class TransientFailureRecoveryTest {
  constructor() {
    this.apiUrl = config.API_BASE_URL;
    this.results = [];
    this.reportPath = path.join(__dirname, '../../resultados/rnf23-transient-recovery-report.json');

    this.maxRetries = Number(process.env.RNF23_MAX_RETRIES || 4);
    this.baseDelayMs = Number(process.env.RNF23_BASE_DELAY_MS || 120);
    this.iterations = Number(process.env.RNF23_ITERATIONS || 12);
    this.failFirstAttempts = Number(process.env.RNF23_FAIL_FIRST_ATTEMPTS || 2);
  }

  log(message, type = 'info') {
    const colors = config.COLORS;
    const timestamp = new Date().toISOString();

    switch (type) {
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
        console.log(`\n${colors.CYAN}${'='.repeat(72)}`);
        console.log(message);
        console.log(`${'='.repeat(72)}${colors.RESET}\n`);
        break;
      default:
        console.log(`${colors.BLUE}ℹ [${timestamp}] ${message}${colors.RESET}`);
    }
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async checkAPIConnection() {
    const endpoints = ['/api/test', '/api/catalogo'];

    for (const endpoint of endpoints) {
      try {
        await axios.get(`${this.apiUrl}${endpoint}`, { timeout: 5000 });
        this.log(`Conexion API OK en ${this.apiUrl}${endpoint}`, 'success');
        return true;
      } catch (error) {
        // intenta siguiente endpoint
      }
    }

    return false;
  }

  isTransientError(error) {
    return (
      error.code === 'ETIMEDOUT' ||
      error.code === 'ECONNRESET' ||
      error.code === 'ECONNABORTED' ||
      error.message.includes('timeout')
    );
  }

  async runOperationWithControlledInterruption(attemptNumber, simulatedFailUntil) {
    // Falla transitoria controlada para validar recuperacion por reintentos.
    if (attemptNumber <= simulatedFailUntil) {
      const transientError = new Error('Simulated transient timeout');
      transientError.code = 'ETIMEDOUT';
      throw transientError;
    }

    const response = await axios.get(`${this.apiUrl}/api/catalogo`, { timeout: 8000 });
    if (response.status !== 200 || !response.data?.success) {
      throw new Error('Operacion sin exito en /api/catalogo');
    }

    return response;
  }

  async executeWithRetry(simulatedFailUntil) {
    const startedAt = process.hrtime.bigint();
    const attemptsLog = [];

    for (let attempt = 1; attempt <= this.maxRetries + 1; attempt++) {
      const attemptStart = process.hrtime.bigint();
      try {
        const response = await this.runOperationWithControlledInterruption(attempt, simulatedFailUntil);
        const attemptMs = Number(process.hrtime.bigint() - attemptStart) / 1e6;
        const totalMs = Number(process.hrtime.bigint() - startedAt) / 1e6;

        attemptsLog.push({ attempt, status: 'success', durationMs: Number(attemptMs.toFixed(2)) });

        return {
          success: true,
          recovered: attempt > 1,
          attemptsUsed: attempt,
          totalDurationMs: Number(totalMs.toFixed(2)),
          attemptsLog,
          responseSize: JSON.stringify(response.data).length
        };
      } catch (error) {
        const attemptMs = Number(process.hrtime.bigint() - attemptStart) / 1e6;
        const transient = this.isTransientError(error);

        attemptsLog.push({
          attempt,
          status: 'failed',
          transient,
          errorCode: error.code || 'N/A',
          error: error.message,
          durationMs: Number(attemptMs.toFixed(2))
        });

        if (!transient || attempt > this.maxRetries) {
          const totalMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
          return {
            success: false,
            recovered: false,
            attemptsUsed: attempt,
            totalDurationMs: Number(totalMs.toFixed(2)),
            attemptsLog,
            finalError: error.message
          };
        }

        const delayMs = this.baseDelayMs * Math.pow(2, attempt - 1);
        await this.sleep(delayMs);
      }
    }

    return {
      success: false,
      recovered: false,
      attemptsUsed: this.maxRetries + 1,
      totalDurationMs: 0,
      attemptsLog,
      finalError: 'Unexpected retry flow end'
    };
  }

  computeSummary() {
    const total = this.results.length;
    const passed = this.results.filter((r) => r.success).length;
    const recovered = this.results.filter((r) => r.recovered).length;

    const durations = this.results.filter((r) => r.success).map((r) => r.totalDurationMs);
    const avgMs = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
    const variance = durations.length
      ? durations.reduce((acc, n) => acc + Math.pow(n - avgMs, 2), 0) / durations.length
      : 0;
    const stdDevMs = Math.sqrt(variance);

    const attemptsAvg = total
      ? this.results.reduce((acc, r) => acc + r.attemptsUsed, 0) / total
      : 0;

    return {
      totalRuns: total,
      successfulRuns: passed,
      recoveredRuns: recovered,
      successRate: total ? Number(((passed / total) * 100).toFixed(2)) : 0,
      recoveryRate: total ? Number(((recovered / total) * 100).toFixed(2)) : 0,
      avgDurationMs: Number(avgMs.toFixed(2)),
      stdDevDurationMs: Number(stdDevMs.toFixed(2)),
      avgAttemptsUsed: Number(attemptsAvg.toFixed(2))
    };
  }

  saveReports(summary) {
    const payload = {
      generatedAt: new Date().toISOString(),
      scenario: {
        flow: 'Operacion del Sistema',
        operation: 'GET /api/catalogo',
        transientFailure: `Timeout simulado en primeros ${this.failFirstAttempts} intentos`,
        retryPolicy: {
          maxRetries: this.maxRetries,
          baseDelayMs: this.baseDelayMs,
          strategy: 'exponential-backoff'
        }
      },
      summary,
      runs: this.results
    };

    const reportDir = path.dirname(this.reportPath);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    fs.writeFileSync(this.reportPath, JSON.stringify(payload, null, 2));

    const htmlPath = this.reportPath.replace('.json', '.html');
    const rows = this.results.map((r, i) => {
      return `<tr>
        <td>${i + 1}</td>
        <td>${r.attemptsUsed}</td>
        <td>${r.totalDurationMs}ms</td>
        <td style="color:${r.success ? '#1b5e20' : '#b71c1c'}">${r.success ? 'OK' : 'FAIL'}</td>
        <td style="color:${r.recovered ? '#1b5e20' : '#616161'}">${r.recovered ? 'SI' : 'NO'}</td>
      </tr>`;
    }).join('');

    const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>RNF-23 Recuperacion ante fallos transitorios</title>
  <style>
    body{font-family:Segoe UI,Arial,sans-serif;background:#f4f7fb;margin:0;padding:24px}
    .card{max-width:1100px;margin:0 auto;background:#fff;border-radius:10px;padding:24px;box-shadow:0 8px 24px rgba(0,0,0,.08)}
    h1{margin:0 0 10px;color:#123}
    .meta{color:#555;margin-bottom:20px}
    .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px}
    .kpi{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px}
    .kpi h3{margin:0;color:#111;font-size:22px}
    .kpi p{margin:4px 0 0;color:#555;font-size:13px}
    table{width:100%;border-collapse:collapse}
    th,td{border-bottom:1px solid #e5e7eb;text-align:left;padding:10px}
    th{background:#f8fafc}
  </style>
</head>
<body>
  <div class="card">
    <h1>RNF-23 Recuperacion ante fallos transitorios</h1>
    <p class="meta">Operacion: GET /api/catalogo | Falla simulada: timeout controlado en primeros intentos</p>

    <div class="grid">
      <div class="kpi"><h3>${summary.successRate}%</h3><p>Tasa de exito</p></div>
      <div class="kpi"><h3>${summary.recoveryRate}%</h3><p>Tasa de recuperacion</p></div>
      <div class="kpi"><h3>${summary.avgDurationMs}ms</h3><p>Promedio total</p></div>
      <div class="kpi"><h3>${summary.stdDevDurationMs}ms</h3><p>Desviacion estandar</p></div>
    </div>

    <table>
      <thead>
        <tr><th>Run</th><th>Intentos</th><th>Duracion</th><th>Estado</th><th>Recuperado</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
</body>
</html>`;

    fs.writeFileSync(htmlPath, html);
    this.log(`Reporte JSON guardado en: ${this.reportPath}`, 'success');
    this.log(`Reporte HTML guardado en: ${htmlPath}`, 'success');
  }

  async run() {
    this.log('Iniciando prueba RNF-23 de recuperacion transitoria', 'header');

    const apiOk = await this.checkAPIConnection();
    if (!apiOk) {
      this.log('No se pudo conectar al backend. Inicia la API y reintenta.', 'error');
      process.exit(1);
    }

    this.log(`Simulando interrupcion controlada: fallan los primeros ${this.failFirstAttempts} intentos`, 'warning');

    for (let i = 0; i < this.iterations; i++) {
      const runResult = await this.executeWithRetry(this.failFirstAttempts);
      this.results.push(runResult);

      this.log(
        `Run ${i + 1}/${this.iterations}: intentos=${runResult.attemptsUsed}, recuperado=${runResult.recovered ? 'SI' : 'NO'}, duracion=${runResult.totalDurationMs}ms`,
        runResult.success ? 'success' : 'error'
      );
    }

    const summary = this.computeSummary();

    this.log('Resumen RNF-23:', 'header');
    this.log(`Tasa de exito: ${summary.successRate}%`);
    this.log(`Tasa de recuperacion: ${summary.recoveryRate}%`);
    this.log(`Promedio: ${summary.avgDurationMs}ms`);
    this.log(`Desviacion estandar: ${summary.stdDevDurationMs}ms`);

    this.saveReports(summary);
  }
}

const runner = new TransientFailureRecoveryTest();
runner.run().catch((err) => {
  console.error('Error fatal RNF-23:', err.message);
  process.exit(1);
});
