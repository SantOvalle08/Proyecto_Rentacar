const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const app = require('../setup/testApp');
const Auto = require('../../src/models/Auto');
const Usuario = require('../../src/models/usuario');
const Reserva = require('../../src/models/Reserva');
const Catalogo = require('../../src/models/Catalogo');
const { crearUsuarioAdmin, crearUsuarioCliente, crearAuto, crearReserva } = require('../helpers/authHelpers');

let mongod, tokenAdmin, tokenCliente, autoDoc, usuarioDoc;

beforeAll(async () => {
  mongod = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(mongod.getUri());
}, 60000);

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
}, 30000);

beforeEach(async () => {
  await Promise.all([
    Usuario.deleteMany({}),
    Auto.deleteMany({}),
    Reserva.deleteMany({}),
    Catalogo.deleteMany({})
  ]);

  const admin = await crearUsuarioAdmin();
  usuarioDoc = await crearUsuarioCliente();
  autoDoc = await crearAuto({ idAuto: 200 });

  const resAdmin = await request(app).post('/api/auth/login').send({ email: 'admin@test.com', contraseña: 'Admin1234' });
  const resCliente = await request(app).post('/api/auth/login').send({ email: 'cliente@test.com', contraseña: 'Cliente1234' });
  tokenAdmin = resAdmin.body.data?.token;
  tokenCliente = resCliente.body.data?.token;
});

describe('Gestión de Reservas - POST /api/reservas', () => {
  const mañana = () => new Date(Date.now() + 86400000).toISOString();
  const pasadoMañana = () => new Date(Date.now() + 3 * 86400000).toISOString();

  test('crea una reserva con datos válidos', async () => {
    const res = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({
        fechaInicio: mañana(),
        fechaFin: pasadoMañana(),
        usuario: usuarioDoc._id.toString(),
        autoId: autoDoc.idAuto
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.reserva).toHaveProperty('estado', 'Pendiente');
    expect(res.body.data.precioTotal).toBeGreaterThan(0);
  });

  test('rechaza reserva sin fecha de inicio', async () => {
    const res = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({
        fechaFin: pasadoMañana(),
        usuario: usuarioDoc._id.toString(),
        autoId: autoDoc.idAuto
      });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('rechaza reserva con fecha inicio posterior a fecha fin', async () => {
    const res = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({
        fechaInicio: pasadoMañana(),
        fechaFin: mañana(),
        usuario: usuarioDoc._id.toString(),
        autoId: autoDoc.idAuto
      });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('rechaza reserva para auto no disponible', async () => {
    await Auto.findByIdAndUpdate(autoDoc._id, { disponible: false });
    const res = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({
        fechaInicio: mañana(),
        fechaFin: pasadoMañana(),
        usuario: usuarioDoc._id.toString(),
        autoId: autoDoc.idAuto
      });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('disponible');
  });

  test('rechaza reserva para auto inexistente', async () => {
    const res = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({
        fechaInicio: mañana(),
        fechaFin: pasadoMañana(),
        usuario: usuarioDoc._id.toString(),
        autoId: 99999
      });
    expect(res.status).toBe(404);
  });

  test('requiere autenticación para crear reserva', async () => {
    const res = await request(app)
      .post('/api/reservas')
      .send({
        fechaInicio: mañana(),
        fechaFin: pasadoMañana(),
        usuario: usuarioDoc._id.toString(),
        autoId: autoDoc.idAuto
      });
    expect(res.status).toBe(401);
  });
});

describe('Gestión de Reservas - GET /api/reservas', () => {
  test('admin obtiene todas las reservas', async () => {
    await crearReserva(autoDoc._id, usuarioDoc._id, { idReserva: 600 });
    const res = await request(app)
      .get('/api/reservas')
      .set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('cliente no puede obtener todas las reservas', async () => {
    const res = await request(app)
      .get('/api/reservas')
      .set('Authorization', `Bearer ${tokenCliente}`);
    expect(res.status).toBe(403);
  });
});

describe('Gestión de Reservas - GET /api/reservas/:id', () => {
  test('obtiene una reserva específica por idReserva', async () => {
    const reserva = await crearReserva(autoDoc._id, usuarioDoc._id, { idReserva: 700 });
    const res = await request(app)
      .get(`/api/reservas/${reserva.idReserva}`)
      .set('Authorization', `Bearer ${tokenCliente}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(700);
  });

  test('retorna 404 para reserva inexistente', async () => {
    const res = await request(app)
      .get('/api/reservas/99999')
      .set('Authorization', `Bearer ${tokenCliente}`);
    expect(res.status).toBe(404);
  });
});

describe('Gestión de Reservas - PUT /api/reservas/:id/cancelar', () => {
  test('cancela una reserva existente', async () => {
    const reserva = await crearReserva(autoDoc._id, usuarioDoc._id, { idReserva: 800 });
    const res = await request(app)
      .put(`/api/reservas/${reserva.idReserva}/cancelar`)
      .set('Authorization', `Bearer ${tokenCliente}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.estado).toBe('Cancelada');
  });

  test('el auto queda disponible tras cancelar la reserva', async () => {
    const reserva = await crearReserva(autoDoc._id, usuarioDoc._id, { idReserva: 801 });
    await request(app)
      .put(`/api/reservas/${reserva.idReserva}/cancelar`)
      .set('Authorization', `Bearer ${tokenCliente}`);
    const autoActualizado = await Auto.findById(autoDoc._id);
    expect(autoActualizado.disponible).toBe(true);
  });
});

describe('Gestión de Reservas - POST /api/reservas/calcular-precio', () => {
  test('calcula precio correctamente para reserva de 3 días', async () => {
    const res = await request(app)
      .post('/api/reservas/calcular-precio')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({
        fechaInicio: new Date(Date.now() + 86400000).toISOString(),
        fechaFin: new Date(Date.now() + 4 * 86400000).toISOString(),
        autoId: autoDoc.idAuto
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.precioTotal).toBeGreaterThan(0);
    expect(res.body.data.dias).toBe(3);
  });

  test('calcula descuento para reserva de 7+ días', async () => {
    const res = await request(app)
      .post('/api/reservas/calcular-precio')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({
        fechaInicio: new Date(Date.now() + 86400000).toISOString(),
        fechaFin: new Date(Date.now() + 8 * 86400000).toISOString(),
        autoId: autoDoc.idAuto
      });
    expect(res.status).toBe(200);
    expect(res.body.data.descuento).toBe(15);
  });
});

describe('Gestión de Reservas - GET /api/reservas/:id/factura', () => {
  test('genera factura para una reserva existente', async () => {
    const reserva = await crearReserva(autoDoc._id, usuarioDoc._id, { idReserva: 900 });
    const res = await request(app)
      .get(`/api/reservas/${reserva.idReserva}/factura`)
      .set('Authorization', `Bearer ${tokenCliente}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('numeroFactura');
    expect(res.body.data).toHaveProperty('cliente');
    expect(res.body.data).toHaveProperty('detalles');
    expect(res.body.data.detalles).toHaveProperty('total');
  });
});

describe('Gestión de Reservas - Reservas por usuario', () => {
  test('obtiene reservas de un usuario específico', async () => {
    await crearReserva(autoDoc._id, usuarioDoc._id, { idReserva: 1000 });
    const res = await request(app)
      .get(`/api/usuarios/${usuarioDoc._id}/reservas`)
      .set('Authorization', `Bearer ${tokenCliente}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(1);
  });
});
