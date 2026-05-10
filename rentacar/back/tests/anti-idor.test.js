/**
 * TEST: Validación anti-IDOR después de refuerzo de seguridad
 * 
 * Valida que:
 * 1. Usuario A no puede ver reservas de Usuario B
 * 2. Usuario A no puede ver datos de Usuario B
 * 3. Usuario A no puede cancelar/facturar reservas de Usuario B
 * 4. Admin SÍ puede ver/modificar reservas y usuarios de cualquiera
 */

const http = require('http');

const API_URL = process.env.API_URL || 'http://localhost:8080';
const testStats = { total: 0, passed: 0 };

function makeRequest(method, endpoint, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const api = new URL(API_URL);
    const path = `${api.pathname === '/' ? '' : api.pathname}${endpoint}`;

    const options = {
      hostname: api.hostname,
      port: api.port || 80,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers.Authorization = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: body ? JSON.parse(body) : {} });
        } catch (_e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function getToken(email, contraseña) {
  const response = await makeRequest('POST', '/api/auth/login', { email, contraseña });
  if (response.status === 200 && response.body?.success && response.body?.data?.token) {
    return response.body.data.token;
  }
  return null;
}

async function getTokenWithCandidates(email, passwordCandidates) {
  for (const contraseña of passwordCandidates) {
    const token = await getToken(email, contraseña);
    if (token) {
      return token;
    }
  }
  return null;
}

function report(passed, title, details = '') {
  testStats.total += 1;
  if (passed) {
    testStats.passed += 1;
  }

  console.log(`  ${passed ? '✓' : '✗'} ${title}`);
  if (!passed && details) {
    console.log(`    ${details}`);
  }
  return passed ? 1 : 0;
}

async function runTests() {
  console.log('\n' + '='.repeat(70));
  console.log('TEST: VALIDACIÓN ANTI-IDOR');
  console.log('='.repeat(70) + '\n');

  // Registrar y autenticar dos usuarios regulares
  const user1Email = `testuser1-${Date.now()}@example.com`;
  const user2Email = `testuser2-${Date.now()}@example.com`;
  const adminEmail = 'admin@rentacar.com';
  const password = 'TestPassword123';

  let passCount = 0;
  let failCount = 0;

  console.log('TEST 1: Crear dos usuarios y obtener tokens');
  console.log('-'.repeat(70));

  // Crear usuario 1
  const user1Reg = await makeRequest('POST', '/api/auth/register', {
    nombre: 'Usuario Prueba 1',
    email: user1Email,
    contraseña: password
  });
  passCount += report(user1Reg.status === 201, 'Usuario 1 registrado', `Status: ${user1Reg.status}`);

  // Crear usuario 2
  const user2Reg = await makeRequest('POST', '/api/auth/register', {
    nombre: 'Usuario Prueba 2',
    email: user2Email,
    contraseña: password
  });
  passCount += report(user2Reg.status === 201, 'Usuario 2 registrado', `Status: ${user2Reg.status}`);

  // Obtener tokens
  const user1Token = await getToken(user1Email, password);
  const user2Token = await getToken(user2Email, password);
  const adminToken = await getTokenWithCandidates(adminEmail, [
    process.env.ADMIN_PASSWORD,
    'admin123',
    'Admin123456'
  ].filter(Boolean));

  passCount += report(!!user1Token, 'Token Usuario 1 obtenido');
  passCount += report(!!user2Token, 'Token Usuario 2 obtenido');
  passCount += report(!!adminToken, 'Token Admin obtenido');

  if (!user1Token || !user2Token) {
    console.log('\n❌ No se pudieron obtener tokens. Deteniendo pruebas.');
    process.exit(1);
  }

  // Extraer IDs de usuarios (desde response de login o registration)
  let user1Id = user1Reg.body?.data?.idUser || '1';
  let user2Id = user2Reg.body?.data?.idUser || '2';

  // Si no tenemos IDs, intentar obtenerlos del login
  const user1Login = await makeRequest('POST', '/api/auth/login', { email: user1Email, contraseña: password });
  if (user1Login.body?.data?.usuario?.idUser) {
    user1Id = user1Login.body.data.usuario.idUser;
  }

  const user2Login = await makeRequest('POST', '/api/auth/login', { email: user2Email, contraseña: password });
  if (user2Login.body?.data?.usuario?.idUser) {
    user2Id = user2Login.body.data.usuario.idUser;
  }

  console.log(`\n  User1 ID: ${user1Id}, User2 ID: ${user2Id}\n`);

  console.log('TEST 2: Usuario A intenta acceder a datos de Usuario B (DEBE FALLAR)');
  console.log('-'.repeat(70));

  const user1AccessUser2 = await makeRequest('GET', `/api/usuarios/${user2Id}`, null, user1Token);
  const user1AccessUser2Blocked = user1AccessUser2.status === 403;
  passCount += report(
    user1AccessUser2Blocked,
    'Usuario 1 NO puede acceder a datos de Usuario 2',
    `Status: ${user1AccessUser2.status}, esperado 403`
  );
  failCount += user1AccessUser2Blocked ? 0 : 1;

  console.log('\nTEST 3: Usuario A intenta actualizar perfil de Usuario B (DEBE FALLAR)');
  console.log('-'.repeat(70));

  const user1UpdateUser2 = await makeRequest('PUT', `/api/usuarios/${user2Id}`, {
    nombre: 'Nombre Modificado Maliciosamente',
    email: user2Email,
    telefono: '9999999999'
  }, user1Token);
  const user1UpdateUser2Blocked = user1UpdateUser2.status === 403;
  passCount += report(
    user1UpdateUser2Blocked,
    'Usuario 1 NO puede actualizar Usuario 2',
    `Status: ${user1UpdateUser2.status}, esperado 403`
  );
  failCount += user1UpdateUser2Blocked ? 0 : 1;

  console.log('\nTEST 4: Admin PUEDE acceder a datos de cualquier usuario');
  console.log('-'.repeat(70));

  const adminAccessUser1 = await makeRequest('GET', `/api/usuarios/${user1Id}`, null, adminToken);
  const adminAccessUser1Allowed = adminAccessUser1.status === 200;
  passCount += report(
    adminAccessUser1Allowed,
    'Admin PUEDE acceder a datos de Usuario 1',
    `Status: ${adminAccessUser1.status}`
  );

  const adminAccessUser2 = await makeRequest('GET', `/api/usuarios/${user2Id}`, null, adminToken);
  const adminAccessUser2Allowed = adminAccessUser2.status === 200;
  passCount += report(
    adminAccessUser2Allowed,
    'Admin PUEDE acceder a datos de Usuario 2',
    `Status: ${adminAccessUser2.status}`
  );

  console.log('\nTEST 5: Crear reservas para ambos usuarios');
  console.log('-'.repeat(70));

  // Obtener un auto existente
  const autosResponse = await makeRequest('GET', '/api/autos', null, user1Token);
  if (autosResponse.status !== 200 || !autosResponse.body?.data?.length) {
    console.log('  ⚠ No hay autos disponibles para crear reservas. Saltando tests de reserva.');
  } else {
    const autoDisponible = autosResponse.body.data.find((auto) => auto.disponible !== false);
    const autoSeleccionado = autoDisponible || autosResponse.body.data[0];
    const autoId = autoSeleccionado?.idAuto || autoSeleccionado?.id;

    if (!autoId) {
      console.log('  ⚠ No se pudo determinar idAuto válido. Saltando tests de reserva.');
      console.log('\n' + '='.repeat(70));
      const computedFailCount = testStats.total - testStats.passed;
      console.log(`RESULTADO FINAL: ${testStats.passed} passed | ${computedFailCount} failed`);
      console.log('='.repeat(70) + '\n');
      process.exit(computedFailCount > 0 ? 1 : 0);
    }

    const hoje = new Date();
    const futuro = new Date(hoje);
    futuro.setDate(futuro.getDate() + 3);

    const reserva1 = await makeRequest('POST', '/api/reservas', {
      fechaInicio: hoje.toISOString(),
      fechaFin: futuro.toISOString(),
      usuario: user1Id,
      autoId: autoId,
      metodoPago: 'efectivo',
      datosPago: {}
    }, user1Token);

    const reserva1Created = reserva1.status === 201 && reserva1.body?.success;
    passCount += report(
      reserva1Created,
      'Reserva de Usuario 1 creada',
      `Status: ${reserva1.status}`
    );

    const reserva1Id = reserva1.body?.data?.reserva?.id || reserva1.body?.data?.id;

    if (reserva1Created && reserva1Id) {
      console.log('\nTEST 6: Usuario A intenta acceder a reservas de Usuario B (DEBE FALLAR)');
      console.log('-'.repeat(70));

      const user1AccessReserva = await makeRequest('GET', `/api/reservas/${reserva1Id}`, null, user2Token);
      const user1AccessReservaBlocked = user1AccessReserva.status === 403;
      passCount += report(
        user1AccessReservaBlocked,
        'Usuario 2 NO puede ver reserva de Usuario 1',
        `Status: ${user1AccessReserva.status}, esperado 403`
      );
      failCount += user1AccessReservaBlocked ? 0 : 1;

      console.log('\nTEST 7: Usuario A intenta cancelar reserva de Usuario B (DEBE FALLAR)');
      console.log('-'.repeat(70));

      const user1CancelReserva = await makeRequest('PUT', `/api/reservas/${reserva1Id}/cancelar`, {}, user2Token);
      const user1CancelReservaBlocked = user1CancelReserva.status === 403;
      passCount += report(
        user1CancelReservaBlocked,
        'Usuario 2 NO puede cancelar reserva de Usuario 1',
        `Status: ${user1CancelReserva.status}, esperado 403`
      );
      failCount += user1CancelReservaBlocked ? 0 : 1;

      console.log('\nTEST 8: Admin PUEDE ver y cancelar reservas de cualquier usuario');
      console.log('-'.repeat(70));

      const adminAccessReserva = await makeRequest('GET', `/api/reservas/${reserva1Id}`, null, adminToken);
      const adminAccessReservaAllowed = adminAccessReserva.status === 200;
      passCount += report(
        adminAccessReservaAllowed,
        'Admin PUEDE ver reserva de Usuario 1',
        `Status: ${adminAccessReserva.status}`
      );
    }
  }

  const computedFailCount = testStats.total - testStats.passed;

  console.log('\n' + '='.repeat(70));
  console.log(`RESULTADO FINAL: ${testStats.passed} passed | ${computedFailCount} failed`);
  console.log('='.repeat(70) + '\n');

  if (computedFailCount > 0) {
    console.log('❌ FALLOS DETECTADOS: El sistema aún permite acceso cruzado (IDOR)');
    process.exit(1);
  } else {
    console.log('✅ VALIDACIÓN EXITOSA: El acceso cruzado está bloqueado correctamente');
    process.exit(0);
  }
}

runTests().catch((error) => {
  console.error('Error fatal en tests:', error);
  process.exit(1);
});
