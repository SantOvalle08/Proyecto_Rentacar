/**
 * Tests para validar correcciones de severidad ALTA en CRUD de vehiculos
 * - Issue #2: Required fields (combustible, transmision, capacidad)
 * - Issue #3: Type enum alignment
 * - Issue #4 y #5: Image upload y persistencia
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const API_BASE_URL = process.env.API_URL || 'http://localhost:8080';
const LOGIN_CANDIDATES = [
  { email: 'admin@rentacar.com', contraseña: 'admin123' },
  { email: 'admin@rentacar.com', contraseña: 'Admin123456' }
];

const testAutoComplete = {
  marca: 'TestBrand',
  modelo: 'TestModel',
  año: 2024,
  tipoCoche: 'Sedan',
  precioDia: 50,
  combustible: 'Gasolina',
  transmision: 'Automática',
  capacidad: 5,
  color: 'Rojo',
  disponible: true
};

const testTypesCovered = [
  'Compacto',
  'Sedan',
  'SUV',
  'Deportivo',
  'Camioneta',
  'Lujo',
  'Hatchback',
  'Pickup',
  'Minivan'
];

const testCombustibles = ['Gasolina', 'Diesel', 'Híbrido', 'Eléctrico'];
const testTransmisiones = ['Manual', 'Automática'];

function parseBaseUrl(baseUrl) {
  const parsed = new URL(baseUrl);
  return {
    protocol: parsed.protocol,
    hostname: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : (parsed.protocol === 'https:' ? 443 : 80),
    basePath: parsed.pathname === '/' ? '' : parsed.pathname
  };
}

const baseConfig = parseBaseUrl(API_BASE_URL);

function sendRequest(method, endpoint, { json, headers = {}, bodyBuffer } = {}) {
  return new Promise((resolve, reject) => {
    const requestPath = `${baseConfig.basePath}${endpoint}`;
    const requestHeaders = { ...headers };

    let requestBody = bodyBuffer || null;

    if (json !== undefined) {
      requestBody = Buffer.from(JSON.stringify(json));
      requestHeaders['Content-Type'] = 'application/json';
      requestHeaders['Content-Length'] = requestBody.length;
    } else if (requestBody) {
      requestHeaders['Content-Length'] = requestBody.length;
    }

    const options = {
      protocol: baseConfig.protocol,
      hostname: baseConfig.hostname,
      port: baseConfig.port,
      path: requestPath,
      method,
      headers: requestHeaders
    };

    const transport = baseConfig.protocol === 'https:' ? https : http;
    const req = transport.request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        let data = raw;
        try {
          data = raw ? JSON.parse(raw) : {};
        } catch (_e) {
          // Keep raw body when not JSON.
        }

        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);

    if (requestBody) {
      req.write(requestBody);
    }

    req.end();
  });
}

async function getAdminToken() {
  for (const credentials of LOGIN_CANDIDATES) {
    const response = await sendRequest('POST', '/api/auth/login', { json: credentials });
    if (response.status === 200 && response.body?.success && response.body?.data?.token) {
      return response.body.data.token;
    }
  }

  return null;
}

function bearer(token) {
  return { Authorization: `Bearer ${token}` };
}

function logTestResult(ok, label, details) {
  const icon = ok ? '✓' : '✗';
  console.log(`  ${icon} ${label}`);
  if (!ok && details) {
    console.log(`    ${details}`);
  }
}

async function testRequiredFieldsValidation(adminToken) {
  console.log('TEST 1: Issue #2 - Validacion de campos requeridos');
  console.log('-'.repeat(60));

  let passed = 0;
  let failed = 0;

  const cases = [
    { label: 'Sin combustible', data: { ...testAutoComplete, combustible: '' }, shouldPass: false },
    { label: 'Sin transmision', data: { ...testAutoComplete, transmision: '' }, shouldPass: false },
    { label: 'Sin capacidad', data: { ...testAutoComplete, capacidad: '' }, shouldPass: false },
    { label: 'Con todos los campos', data: { ...testAutoComplete }, shouldPass: true }
  ];

  for (const testCase of cases) {
    const payload = {
      ...testCase.data,
      matricula: `TEST-${Date.now()}-${Math.floor(Math.random() * 9999)}`
    };

    try {
      const response = await sendRequest('POST', '/api/autos', {
        json: payload,
        headers: bearer(adminToken)
      });

      const ok = testCase.shouldPass
        ? response.status === 201 && response.body?.success
        : response.status >= 400 && response.body?.success === false;

      logTestResult(ok, testCase.label, `Status ${response.status} - ${response.body?.message || 'sin mensaje'}`);

      if (ok) {
        passed += 1;
      } else {
        failed += 1;
      }

      if (ok && testCase.shouldPass && response.body?.data?.id) {
        await sendRequest('DELETE', `/api/autos/${response.body.data.id}`, {
          headers: bearer(adminToken)
        });
      }
    } catch (error) {
      failed += 1;
      logTestResult(false, testCase.label, error.message);
    }
  }

  console.log('');
  return { passed, failed };
}

async function testTypeEnumValidation(adminToken) {
  console.log('TEST 2: Issue #3 - Validacion de enum de tipos');
  console.log('-'.repeat(60));

  let passed = 0;
  let failed = 0;

  for (const type of testTypesCovered) {
    const payload = {
      ...testAutoComplete,
      tipoCoche: type,
      matricula: `TEST-${Date.now()}-${type}-${Math.floor(Math.random() * 9999)}`
    };

    try {
      const response = await sendRequest('POST', '/api/autos', {
        json: payload,
        headers: bearer(adminToken)
      });

      const ok = response.status === 201 && response.body?.success;
      logTestResult(ok, `Tipo '${type}'`, `Status ${response.status} - ${response.body?.message || 'sin mensaje'}`);

      if (ok) {
        passed += 1;
      } else {
        failed += 1;
      }

      if (response.body?.data?.id) {
        await sendRequest('DELETE', `/api/autos/${response.body.data.id}`, {
          headers: bearer(adminToken)
        });
      }
    } catch (error) {
      failed += 1;
      logTestResult(false, `Tipo '${type}'`, error.message);
    }
  }

  console.log('');
  return { passed, failed };
}

async function testCombustibleTransmisionEnums(adminToken) {
  console.log('TEST 3: Validacion de enums combustible y transmision');
  console.log('-'.repeat(60));

  let passed = 0;
  let failed = 0;

  for (const combustible of testCombustibles) {
    const payload = {
      ...testAutoComplete,
      combustible,
      matricula: `TEST-${Date.now()}-COMB-${Math.floor(Math.random() * 9999)}`
    };

    try {
      const response = await sendRequest('POST', '/api/autos', {
        json: payload,
        headers: bearer(adminToken)
      });

      const ok = response.status === 201 && response.body?.success;
      logTestResult(ok, `Combustible '${combustible}'`, `Status ${response.status} - ${response.body?.message || 'sin mensaje'}`);

      if (ok) {
        passed += 1;
      } else {
        failed += 1;
      }

      if (response.body?.data?.id) {
        await sendRequest('DELETE', `/api/autos/${response.body.data.id}`, {
          headers: bearer(adminToken)
        });
      }
    } catch (error) {
      failed += 1;
      logTestResult(false, `Combustible '${combustible}'`, error.message);
    }
  }

  for (const transmision of testTransmisiones) {
    const payload = {
      ...testAutoComplete,
      transmision,
      matricula: `TEST-${Date.now()}-TR-${Math.floor(Math.random() * 9999)}`
    };

    try {
      const response = await sendRequest('POST', '/api/autos', {
        json: payload,
        headers: bearer(adminToken)
      });

      const ok = response.status === 201 && response.body?.success;
      logTestResult(ok, `Transmision '${transmision}'`, `Status ${response.status} - ${response.body?.message || 'sin mensaje'}`);

      if (ok) {
        passed += 1;
      } else {
        failed += 1;
      }

      if (response.body?.data?.id) {
        await sendRequest('DELETE', `/api/autos/${response.body.data.id}`, {
          headers: bearer(adminToken)
        });
      }
    } catch (error) {
      failed += 1;
      logTestResult(false, `Transmision '${transmision}'`, error.message);
    }
  }

  console.log('');
  return { passed, failed };
}

async function testImageUploadPersistence(adminToken) {
  console.log('TEST 4: Issue #4 y #5 - Upload de imagen y persistencia');
  console.log('-'.repeat(60));

  let passed = 0;
  let failed = 0;

  const testImagePath = path.join(__dirname, 'test-image.png');
  const minimalPng = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
    0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41,
    0x54, 0x08, 0x99, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
    0x00, 0x00, 0x03, 0x00, 0x01, 0x3b, 0xb6, 0xee,
    0x56, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e,
    0x44, 0xae, 0x42, 0x60, 0x82
  ]);

  try {
    fs.writeFileSync(testImagePath, minimalPng);

    const boundary = `----RentacarBoundary${Date.now()}`;
    const fileBuffer = fs.readFileSync(testImagePath);

    const head = Buffer.from(
      `--${boundary}\r\n` +
      'Content-Disposition: form-data; name="file"; filename="test-image.png"\r\n' +
      'Content-Type: image/png\r\n\r\n',
      'utf8'
    );
    const tail = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
    const bodyBuffer = Buffer.concat([head, fileBuffer, tail]);

    const uploadResponse = await sendRequest('POST', '/api/upload', {
      headers: {
        ...bearer(adminToken),
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      bodyBuffer
    });

    const isRelativePath =
      uploadResponse.body?.success &&
      typeof uploadResponse.body?.path === 'string' &&
      uploadResponse.body.path.startsWith('/images/autos/');

    logTestResult(
      isRelativePath,
      'Upload devuelve path relativo',
      `Status ${uploadResponse.status} - ${uploadResponse.body?.message || 'sin mensaje'}`
    );

    if (isRelativePath) {
      passed += 1;

      const fileResponse = await sendRequest('GET', uploadResponse.body.path);
      const fileOk = fileResponse.status === 200;
      logTestResult(fileOk, 'Imagen accesible por HTTP', `Status ${fileResponse.status}`);
      if (fileOk) {
        passed += 1;
      } else {
        failed += 1;
      }
    } else {
      failed += 1;
    }
  } catch (error) {
    failed += 1;
    logTestResult(false, 'Upload de imagen', error.message);
  } finally {
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
  }

  console.log('');
  return { passed, failed };
}

async function testEndToEndVehicleCreation(adminToken) {
  console.log('TEST 5: End-to-end de vehiculo completo');
  console.log('-'.repeat(60));

  let passed = 0;
  let failed = 0;

  const payload = {
    ...testAutoComplete,
    matricula: `TEST-E2E-${Date.now()}-${Math.floor(Math.random() * 9999)}`
  };

  try {
    const createResponse = await sendRequest('POST', '/api/autos', {
      json: payload,
      headers: bearer(adminToken)
    });

    const createOk = createResponse.status === 201 && createResponse.body?.success && createResponse.body?.data?.id;
    logTestResult(createOk, 'Creacion de vehiculo', `Status ${createResponse.status} - ${createResponse.body?.message || 'sin mensaje'}`);

    if (!createOk) {
      return { passed, failed: failed + 1 };
    }

    passed += 1;
    const vehicleId = createResponse.body.data.id;

    const getResponse = await sendRequest('GET', `/api/autos/${vehicleId}`);
    const fields = getResponse.body?.data || {};
    const fieldsOk =
      getResponse.status === 200 &&
      getResponse.body?.success &&
      fields.combustible != null &&
      fields.transmision != null &&
      fields.capacidad != null;

    logTestResult(fieldsOk, 'Lectura y campos requeridos', `Status ${getResponse.status}`);
    if (fieldsOk) {
      passed += 1;
    } else {
      failed += 1;
    }

    const updateResponse = await sendRequest('PUT', `/api/autos/${vehicleId}`, {
      json: {
        ...payload,
        transmision: 'Manual',
        capacidad: 7
      },
      headers: bearer(adminToken)
    });

    const updateOk = updateResponse.status === 200 && updateResponse.body?.success;
    logTestResult(updateOk, 'Actualizacion de vehiculo', `Status ${updateResponse.status} - ${updateResponse.body?.message || 'sin mensaje'}`);
    if (updateOk) {
      passed += 1;
    } else {
      failed += 1;
    }

    const deleteResponse = await sendRequest('DELETE', `/api/autos/${vehicleId}`, {
      headers: bearer(adminToken)
    });

    const deleteOk = deleteResponse.status === 200 && deleteResponse.body?.success;
    logTestResult(deleteOk, 'Eliminacion de vehiculo', `Status ${deleteResponse.status} - ${deleteResponse.body?.message || 'sin mensaje'}`);
    if (deleteOk) {
      passed += 1;
    } else {
      failed += 1;
    }
  } catch (error) {
    failed += 1;
    logTestResult(false, 'Flujo E2E', error.message);
  }

  console.log('');
  return { passed, failed };
}

async function runAllTests() {
  console.log('\nTESTS DE CORRECCIONES HIGH-SEVERITY\n');
  console.log('='.repeat(60));

  const adminToken = await getAdminToken();
  if (!adminToken) {
    console.error('No se pudo obtener token admin. Verifica credenciales del usuario administrador.');
    process.exit(1);
  }

  const results = [];
  results.push(await testRequiredFieldsValidation(adminToken));
  results.push(await testTypeEnumValidation(adminToken));
  results.push(await testCombustibleTransmisionEnums(adminToken));
  results.push(await testImageUploadPersistence(adminToken));
  results.push(await testEndToEndVehicleCreation(adminToken));

  const passed = results.reduce((sum, r) => sum + r.passed, 0);
  const failed = results.reduce((sum, r) => sum + r.failed, 0);

  console.log('='.repeat(60));
  console.log(`RESULTADO FINAL: ${passed} passed | ${failed} failed`);

  process.exit(failed > 0 ? 1 : 0);
}

runAllTests().catch((error) => {
  console.error('Error fatal en tests:', error);
  process.exit(1);
});
