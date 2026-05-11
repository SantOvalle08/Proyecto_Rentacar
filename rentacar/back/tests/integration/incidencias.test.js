const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../setup/testApp');
const Auto = require('../../src/models/Auto');
const Usuario = require('../../src/models/usuario');
const Reserva = require('../../src/models/Reserva');
const Entrega = require('../../src/models/Entrega');
const Incidencia = require('../../src/models/Incidencia');
const Catalogo = require('../../src/models/Catalogo');
const { crearUsuarioAdmin, crearUsuarioCliente, crearAuto, crearReserva } = require('../helpers/authHelpers');

let mongod, tokenAdmin, tokenCliente, autoDoc, usuarioDoc, reservaAlquilada;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
});

beforeEach(async () => {
  await Promise.all([
    Usuario.deleteMany({}),
    Auto.deleteMany({}),
    Reserva.deleteMany({}),
    Entrega.deleteMany({}),
    Incidencia.deleteMany({}),
    Catalogo.deleteMany({})
  ]);

  await crearUsuarioAdmin();
  usuarioDoc = await crearUsuarioCliente();
  autoDoc = await crearAuto({ idAuto: 400 });

  const resAdmin = await request(app).post('/api/auth/login').send({ email: 'admin@test.com', contraseña: 'Admin1234' });
  const resCliente = await request(app).post('/api/auth/login').send({ email: 'cliente@test.com', contraseña: 'Cliente1234' });
  tokenAdmin = resAdmin.body.data?.token;
  tokenCliente = resCliente.body.data?.token;

  const reserva = await crearReserva(autoDoc._id, usuarioDoc._id, {
    idReserva: 500,
    estado: 'Confirmada',
    fechaInicio: new Date(Date.now() - 86400000),
    fechaFin: new Date(Date.now() + 2 * 86400000)
  });

  await request(app)
    .post(`/api/reservas/${reserva.idReserva}/checkout`)
    .set('Authorization', `Bearer ${tokenAdmin}`)
    .send({ kmSalida: 15000, porcentajeGasolina: 100 });

  reservaAlquilada = await Reserva.findOne({ idReserva: reserva.idReserva });
});

describe('Proceso de Incidencias - POST /api/reservas/:id/incidencias', () => {
  test('reporta incidencia en reserva activa', async () => {
    const res = await request(app)
      .post(`/api/reservas/${reservaAlquilada.idReserva}/incidencias`)
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({
        tipo: 'Accidente',
        descripcion: 'Golpe leve en el parachoques delantero',
        costoEstimado: 500,
        observaciones: 'Ocurrió en el estacionamiento'
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('idIncidencia');
    expect(res.body.data.tipo).toBe('Accidente');
    expect(res.body.data.costoEstimado).toBe(500);
  });

  test('rechaza incidencia sin tipo', async () => {
    const res = await request(app)
      .post(`/api/reservas/${reservaAlquilada.idReserva}/incidencias`)
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({
        descripcion: 'Golpe leve en el parachoques'
      });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('requeridos');
  });

  test('rechaza incidencia sin descripción', async () => {
    const res = await request(app)
      .post(`/api/reservas/${reservaAlquilada.idReserva}/incidencias`)
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({
        tipo: 'Avería mecánica'
      });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('rechaza incidencia en reserva no activa', async () => {
    const reservaPendiente = await crearReserva(autoDoc._id, usuarioDoc._id, { idReserva: 501, estado: 'Pendiente' });
    const res = await request(app)
      .post(`/api/reservas/${reservaPendiente.idReserva}/incidencias`)
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ tipo: 'Rotura', descripcion: 'Cristal roto' });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('activas');
  });

  test('retorna 404 para reserva inexistente', async () => {
    const res = await request(app)
      .post('/api/reservas/99999/incidencias')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ tipo: 'Avería mecánica', descripcion: 'Motor apagado' });
    expect(res.status).toBe(404);
  });

  test('requiere autenticación para reportar incidencia', async () => {
    const res = await request(app)
      .post(`/api/reservas/${reservaAlquilada.idReserva}/incidencias`)
      .send({ tipo: 'Avería mecánica', descripcion: 'Motor apagado' });
    expect(res.status).toBe(401);
  });
});

describe('Proceso de Incidencias - GET /api/reservas/:id/incidencias', () => {
  beforeEach(async () => {
    await Incidencia.create({
      idIncidencia: 1,
      reserva: reservaAlquilada._id,
      auto: autoDoc._id,
      tipo: 'Accidente',
      descripcion: 'Primera incidencia de prueba',
      fecha: new Date(),
      costoEstimado: 200
    });
    await Incidencia.create({
      idIncidencia: 2,
      reserva: reservaAlquilada._id,
      auto: autoDoc._id,
      tipo: 'Avería mecánica',
      descripcion: 'Segunda incidencia de prueba',
      fecha: new Date(),
      costoEstimado: 100
    });
  });

  test('lista incidencias de una reserva activa', async () => {
    const res = await request(app)
      .get(`/api/reservas/${reservaAlquilada.idReserva}/incidencias`)
      .set('Authorization', `Bearer ${tokenCliente}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(2);
  });

  test('incidencias están ordenadas por fecha descendente', async () => {
    const res = await request(app)
      .get(`/api/reservas/${reservaAlquilada.idReserva}/incidencias`)
      .set('Authorization', `Bearer ${tokenCliente}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test('retorna lista vacía si no hay incidencias', async () => {
    await Incidencia.deleteMany({});
    const res = await request(app)
      .get(`/api/reservas/${reservaAlquilada.idReserva}/incidencias`)
      .set('Authorization', `Bearer ${tokenCliente}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(0);
  });

  test('requiere autenticación para ver incidencias', async () => {
    const res = await request(app)
      .get(`/api/reservas/${reservaAlquilada.idReserva}/incidencias`);
    expect(res.status).toBe(401);
  });

  test('retorna 404 para reserva inexistente', async () => {
    const res = await request(app)
      .get('/api/reservas/99999/incidencias')
      .set('Authorization', `Bearer ${tokenCliente}`);
    expect(res.status).toBe(404);
  });
});

describe('Proceso de Incidencias - Múltiples incidencias en alquiler', () => {
  test('permite registrar múltiples incidencias en una misma reserva', async () => {
    await request(app)
      .post(`/api/reservas/${reservaAlquilada.idReserva}/incidencias`)
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ tipo: 'Accidente', descripcion: 'Primera incidencia' });
    await request(app)
      .post(`/api/reservas/${reservaAlquilada.idReserva}/incidencias`)
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ tipo: 'Avería mecánica', descripcion: 'Segunda incidencia' });

    const res = await request(app)
      .get(`/api/reservas/${reservaAlquilada.idReserva}/incidencias`)
      .set('Authorization', `Bearer ${tokenCliente}`);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
  });
});
