/**
 * TEST-003: Tiempo de Procesamiento de Pago (Facturacion)
 * RNF Validados: RNF-001 (Tiempo de respuesta)
 *
 * Operacion medida:
 * - GET /api/reservas/:id/factura
 *
 * Esta operacion representa el cierre de facturacion/pago de una reserva,
 * porque calcula subtotal, impuestos y total final antes de emitir la factura.
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const config = require('../config');

class PaymentProcessingPerformanceTest {
  constructor() {
    this.apiUrl = config.API_BASE_URL;
    this.token = null;
    this.results = [];
    this.reportPath = path.join(__dirname, '../../resultados/payment-processing-report.json');
    this.thresholdMs = Number(process.env.PAYMENT_THRESHOLD_MS || 500);
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

  async measureTime(fn) {
    const start = process.hrtime.bigint();
    await fn();
    const end = process.hrtime.bigint();
    return Number(end - start) / 1e6;
  }

  async checkAPIConnection() {
    const endpoints = ['/api/test', '/api/catalogo'];

    for (const endpoint of endpoints) {
      try {
        await axios.get(`${this.apiUrl}${endpoint}`, { timeout: 5000 });
        this.log(`Conexion a API establecida: ${this.apiUrl}${endpoint}`, 'success');
        return true;
      } catch (error) {
        // continua
      }
    }

    return false;
  }

  async authenticate() {
    this.log('Autenticando para pruebas de facturacion/pagos...', 'info');

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
        const token = response.data?.data?.token;
        if (token) {
          this.token = token;
          this.log(`Autenticacion exitosa con ${credentials.email}`, 'success');
          return true;
        }
      } catch (error) {
        // continua con siguiente candidato
      }
    }

    this.log('No se pudo autenticar. Define TEST_AUTH_EMAIL y TEST_AUTH_PASSWORD.', 'error');
    return false;
  }

  getAuthHeaders() {
    return {
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }

  computeStats(samples) {
    const sorted = [...samples].sort((a, b) => a - b);
    const avg = samples.reduce((acc, n) => acc + n, 0) / samples.length;
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const variance = samples.reduce((acc, n) => acc + Math.pow(n - avg, 2), 0) / samples.length;
    const stdDev = Math.sqrt(variance);
    const p95Index = Math.ceil(sorted.length * 0.95) - 1;
    const p95 = sorted[Math.max(p95Index, 0)];

    return {
      avg,
      min,
      max,
      stdDev,
      p95
    };
  }

  async getReservaIdParaFacturar() {
    const response = await axios.get(`${this.apiUrl}/api/reservas`, {
      headers: this.getAuthHeaders()
    });

    const reservas = response.data?.data || [];
    if (!Array.isArray(reservas) || reservas.length === 0) {
      return null;
    }

    const prioritaria = reservas.find((r) => r.estado === 'Completada') || reservas[0];
    return prioritaria?.idReserva || null;
  }

  async getAutoIdParaCalculoPago() {
    const response = await axios.get(`${this.apiUrl}/api/catalogo`, {
      headers: this.getAuthHeaders()
    });

    const autos = response.data?.data || [];
    if (!Array.isArray(autos) || autos.length === 0) {
      return null;
    }

    return autos[0]?.id || autos[0]?.idAuto || null;
  }

  async benchmarkFactura(reservaId) {
    this.log(`Benchmark de procesamiento en GET /api/reservas/${reservaId}/factura`, 'header');

    const iterations = Number(process.env.PAYMENT_BENCH_ITERATIONS || 20);
    const samplesMs = [];

    for (let i = 0; i < iterations; i++) {
      const elapsedMs = await this.measureTime(async () => {
        const res = await axios.get(`${this.apiUrl}/api/reservas/${reservaId}/factura`, {
          headers: this.getAuthHeaders()
        });

        if (!res.data?.success) {
          throw new Error('La API respondio sin exito al generar factura');
        }
      });

      samplesMs.push(elapsedMs);
      this.log(`Iteracion ${i + 1}/${iterations}: ${elapsedMs.toFixed(2)}ms`);
    }

    const stats = this.computeStats(samplesMs);
    const passed = stats.avg <= this.thresholdMs;

    const result = {
      flujo: 'Facturacion y Gestion de Pagos',
      operacion: 'GET /api/reservas/:id/factura',
      reservaId,
      iterations,
      thresholdMs: this.thresholdMs,
      avgMs: Number(stats.avg.toFixed(2)),
      minMs: Number(stats.min.toFixed(2)),
      maxMs: Number(stats.max.toFixed(2)),
      stdDevMs: Number(stats.stdDev.toFixed(2)),
      p95Ms: Number(stats.p95.toFixed(2)),
      passed,
      timestamp: new Date().toISOString()
    };

    this.results.push(result);

    this.log('Resultados del benchmark:', 'info');
    this.log(`Promedio: ${result.avgMs}ms`);
    this.log(`Desviacion estandar: ${result.stdDevMs}ms`);
    this.log(`p95: ${result.p95Ms}ms`);
    this.log(`Umbral esperado: ${result.thresholdMs}ms`);

    if (passed) {
      this.log('Estado: APROBADO', 'success');
    } else {
      this.log(`Estado: FALLIDO (excede por ${(result.avgMs - result.thresholdMs).toFixed(2)}ms)`, 'error');
    }
  }

  async benchmarkCalculoPago(autoId) {
    this.log('Benchmark de procesamiento en POST /api/reservas/calcular-precio', 'header');

    const iterations = Number(process.env.PAYMENT_BENCH_ITERATIONS || 20);
    const samplesMs = [];
    const now = new Date();
    const fechaInicio = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    const fechaFin = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString();

    for (let i = 0; i < iterations; i++) {
      const elapsedMs = await this.measureTime(async () => {
        const res = await axios.post(
          `${this.apiUrl}/api/reservas/calcular-precio`,
          { fechaInicio, fechaFin, autoId },
          { headers: this.getAuthHeaders() }
        );

        if (!res.data?.success) {
          throw new Error('La API respondio sin exito en calculo de pago');
        }
      });

      samplesMs.push(elapsedMs);
      this.log(`Iteracion ${i + 1}/${iterations}: ${elapsedMs.toFixed(2)}ms`);
    }

    const stats = this.computeStats(samplesMs);
    const passed = stats.avg <= this.thresholdMs;

    const result = {
      flujo: 'Facturacion y Gestion de Pagos',
      operacion: 'POST /api/reservas/calcular-precio',
      autoId,
      iterations,
      thresholdMs: this.thresholdMs,
      avgMs: Number(stats.avg.toFixed(2)),
      minMs: Number(stats.min.toFixed(2)),
      maxMs: Number(stats.max.toFixed(2)),
      stdDevMs: Number(stats.stdDev.toFixed(2)),
      p95Ms: Number(stats.p95.toFixed(2)),
      passed,
      timestamp: new Date().toISOString()
    };

    this.results.push(result);

    this.log('Resultados del benchmark:', 'info');
    this.log(`Promedio: ${result.avgMs}ms`);
    this.log(`Desviacion estandar: ${result.stdDevMs}ms`);
    this.log(`p95: ${result.p95Ms}ms`);
    this.log(`Umbral esperado: ${result.thresholdMs}ms`);

    if (passed) {
      this.log('Estado: APROBADO', 'success');
    } else {
      this.log(`Estado: FALLIDO (excede por ${(result.avgMs - result.thresholdMs).toFixed(2)}ms)`, 'error');
    }
  }

  saveReports() {
    const summary = {
      totalTests: this.results.length,
      passedTests: this.results.filter((r) => r.passed).length,
      passRate: this.results.length
        ? Number(((this.results.filter((r) => r.passed).length / this.results.length) * 100).toFixed(2))
        : 0
    };

    const payload = {
      generatedAt: new Date().toISOString(),
      summary,
      results: this.results
    };

    const reportDir = path.dirname(this.reportPath);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    fs.writeFileSync(this.reportPath, JSON.stringify(payload, null, 2));

    const htmlPath = this.reportPath.replace('.json', '.html');
    const rowHtml = this.results.map((r) => {
      return `<tr>
        <td>${r.operacion}</td>
        <td>${r.avgMs}ms</td>
        <td>${r.stdDevMs}ms</td>
        <td>${r.p95Ms}ms</td>
        <td>${r.thresholdMs}ms</td>
        <td style="color:${r.passed ? '#1b5e20' : '#b71c1c'};font-weight:700;">${r.passed ? 'APROBADO' : 'FALLIDO'}</td>
      </tr>`;
    }).join('');

    const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reporte - Tiempo de Procesamiento de Pago</title>
  <style>
    body { font-family: Segoe UI, Arial, sans-serif; background: #f4f7fb; margin: 0; padding: 24px; }
    .card { max-width: 980px; margin: 0 auto; background: #fff; border-radius: 10px; padding: 24px; box-shadow: 0 8px 24px rgba(0,0,0,.08); }
    h1 { margin: 0 0 8px; color: #123; }
    .meta { color: #555; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border-bottom: 1px solid #e5e7eb; text-align: left; padding: 12px; }
    th { background: #f8fafc; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Reporte de Tiempo de Procesamiento de Pago</h1>
    <p class="meta">Flujo: Facturacion y Gestion de Pagos | Generado: ${new Date().toLocaleString()}</p>
    <table>
      <thead>
        <tr>
          <th>Operacion</th>
          <th>Promedio</th>
          <th>Desv. estandar</th>
          <th>p95</th>
          <th>Umbral</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody>${rowHtml}</tbody>
    </table>
  </div>
</body>
</html>`;

    fs.writeFileSync(htmlPath, html);

    this.log(`Reporte JSON guardado en: ${this.reportPath}`, 'success');
    this.log(`Reporte HTML guardado en: ${htmlPath}`, 'success');
  }

  async run() {
    this.log('Iniciando prueba de tiempo de procesamiento de pago', 'header');

    const apiOk = await this.checkAPIConnection();
    if (!apiOk) {
      this.log('No se pudo conectar a la API. Inicia el backend y reintenta.', 'error');
      process.exit(1);
    }

    const authOk = await this.authenticate();
    if (!authOk) {
      process.exit(1);
    }

    const reservaId = await this.getReservaIdParaFacturar();
    if (reservaId) {
      await this.benchmarkFactura(reservaId);
    } else {
      this.log('No hay reservas para facturar. Se usara fallback de calculo de pago.', 'warning');
      const autoId = await this.getAutoIdParaCalculoPago();
      if (!autoId) {
        this.log('No hay autos disponibles para ejecutar el fallback de pago.', 'error');
        process.exit(1);
      }
      await this.benchmarkCalculoPago(autoId);
    }

    this.saveReports();
  }
}

const runner = new PaymentProcessingPerformanceTest();
runner.run().catch((error) => {
  console.error('Error fatal en test de pago:', error.message);
  process.exit(1);
});
