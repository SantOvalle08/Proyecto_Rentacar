const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../setup/testApp');
const Auto = require('../../src/models/Auto');
const Usuario = require('../../src/models/usuario');
const Reserva = require('../../src/models/Reserva');
const Entrega = require('../../src/models/Entrega');
const Devolucion = require('../../src/models/Devolucion');
const Catalogo = require('../../src/models/Catalogo');
const { crearUsuarioAdmin, crearUsuarioCliente, crearAuto, crearReserva } = require('../helpers/authHelpers');

let mongod, tokenAdmin, tokenCliente, autoDoc, usuarioDoc;

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
    Devolucion.deleteMany({}),
    Catalogo.deleteMany({})
  ]);
  await crearUsuarioAdmin();
  usuarioDoc = await crearUsuarioCliente();
  autoDoc = await crearAuto({ idAuto: 300 });

  const resAdmin = await request(app).post('/api/auth/login').send({ email: 'admin@test.com', contraseña: 'Admin1234' });
  const resCliente = await request(app).post('/api/auth/login').send({ email: 'cliente@test.com', contraseña: 'Cliente1234' });
  tokenAdmin = resAdmin.body.data?.token;
  tokenCliente = resCliente.body.data?.token;
});

const crearReservaConfirmada = async () => {
  const reserva = await crearReserva(autoDoc._id, usuarioDoc._id, {
    idReserva: 400,
    estado: 'Confirmada',
    fechaInicio: new Date(Date.now() - 86400000),
    fechaFin: new Date(Date.now() + 2 * 86400000)
  });
  return reserva;
};

describe('Proceso de Entrega - POST /api/reservas/:id/checkout', () => {
  test('admin realiza checkout de reserva confirmada', async () => {
    const reserva = await crearReservaConfirmada();
    const res = await request(app)
      .post(`/api/reservas/${reserva.idReserva}/checkout`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        kmSalida: 25000,
        nivelGasolina: 'Lleno',
        porcentajeGasolina: 100,
        estadoGeneral: 'Bueno',
        inventario: [{ nombre: 'Gato hidráulico', presente: true }],
        dañosPreExistentes: []
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.reservaEstado).toBe('Alquilado');
  });

  test('checkout actualiza estado del auto a alquilado', async () => {
    const reserva = await crearReservaConfirmada();
    await request(app)
      .post(`/api/reservas/${reserva.idReserva}/checkout`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ kmSalida: 25000 });
    const autoActualizado = await Auto.findById(autoDoc._id);
    expect(autoActualizado.estadoVehiculo).toBe('alquilado');
    expect(autoActualizado.disponible).toBe(false);
  });

  test('rechaza checkout sin kilometraje de salida', async () => {
    const reserva = await crearReservaConfirmada();
    const res = await request(app)
      .post(`/api/reservas/${reserva.idReserva}/checkout`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nivelGasolina: 'Lleno' });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('kilometraje');
  });

  test('rechaza checkout de reserva en estado incorrecto', async () => {
    const reserva = await crearReserva(autoDoc._id, usuarioDoc._id, { idReserva: 401, estado: 'Pendiente' });
    const res = await request(app)
      .post(`/api/reservas/${reserva.idReserva}/checkout`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ kmSalida: 25000 });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Confirmada');
  });

  test('cliente no puede hacer checkout (solo admin)', async () => {
    const reserva = await crearReservaConfirmada();
    const res = await request(app)
      .post(`/api/reservas/${reserva.idReserva}/checkout`)
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ kmSalida: 25000 });
    expect(res.status).toBe(403);
  });

  test('retorna 404 para reserva inexistente en checkout', async () => {
    const res = await request(app)
      .post('/api/reservas/99999/checkout')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ kmSalida: 25000 });
    expect(res.status).toBe(404);
  });
});

describe('Proceso de Devolución - POST /api/reservas/:id/checkin', () => {
  let reservaAlquilada, entregaDoc;

  beforeEach(async () => {
    const reserva = await crearReservaConfirmada();
    await request(app)
      .post(`/api/reservas/${reserva.idReserva}/checkout`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ kmSalida: 25000, porcentajeGasolina: 100 });
    reservaAlquilada = await Reserva.findOne({ idReserva: reserva.idReserva });
    entregaDoc = await Entrega.findOne({ reserva: reservaAlquilada._id });
  });

  test('admin registra checkin correctamente', async () => {
    const res = await request(app)
      .post(`/api/reservas/${reservaAlquilada.idReserva}/checkin`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        kmRetorno: 25500,
        nivelGasolina: 'Lleno',
        porcentajeGasolina: 100,
        estadoGeneral: 'Bueno',
        dañosNuevos: [],
        estadoFinalVehiculo: 'disponible'
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.kmRecorridos).toBe(500);
    expect(res.body.data.estadoFinalVehiculo).toBe('disponible');
  });

  test('el auto queda disponible tras checkin normal', async () => {
    await request(app)
      .post(`/api/reservas/${reservaAlquilada.idReserva}/checkin`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ kmRetorno: 25500, estadoFinalVehiculo: 'disponible' });
    const autoActualizado = await Auto.findById(autoDoc._id);
    expect(autoActualizado.disponible).toBe(true);
    expect(autoActualizado.estadoVehiculo).toBe('disponible');
  });

  test('el auto pasa a mantenimiento si se indica', async () => {
    await request(app)
      .post(`/api/reservas/${reservaAlquilada.idReserva}/checkin`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ kmRetorno: 25500, estadoFinalVehiculo: 'mantenimiento' });
    const autoActualizado = await Auto.findById(autoDoc._id);
    expect(autoActualizado.estadoVehiculo).toBe('mantenimiento');
    expect(autoActualizado.disponible).toBe(false);
  });

  test('calcula cargo adicional por combustible faltante', async () => {
    const res = await request(app)
      .post(`/api/reservas/${reservaAlquilada.idReserva}/checkin`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        kmRetorno: 25500,
        porcentajeGasolina: 50,
        estadoFinalVehiculo: 'disponible'
      });
    expect(res.status).toBe(201);
    const cargoCombustible = res.body.data.cargosAdicionales.find(c => c.tipo === 'combustible');
    expect(cargoCombustible).toBeDefined();
    expect(cargoCombustible.monto).toBeGreaterThan(0);
  });

  test('rechaza checkin con kilometraje menor al de salida', async () => {
    const res = await request(app)
      .post(`/api/reservas/${reservaAlquilada.idReserva}/checkin`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ kmRetorno: 24000 });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('menor al de salida');
  });

  test('rechaza checkin de reserva no alquilada', async () => {
    const reservaPendiente = await crearReserva(autoDoc._id, usuarioDoc._id, { idReserva: 450, estado: 'Pendiente' });
    const res = await request(app)
      .post(`/api/reservas/${reservaPendiente.idReserva}/checkin`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ kmRetorno: 1000 });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Alquilado');
  });
});

describe('Alquileres Activos - GET /api/alquileres', () => {
  test('admin obtiene listado de alquileres activos', async () => {
    const res = await request(app)
      .get('/api/alquileres')
      .set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('cliente no puede ver alquileres activos', async () => {
    const res = await request(app)
      .get('/api/alquileres')
      .set('Authorization', `Bearer ${tokenCliente}`);
    expect(res.status).toBe(403);
  });
});
