const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { Types } = mongoose;
const app = require('../setup/testApp');
const Auto = require('../../src/models/Auto');
const Usuario = require('../../src/models/usuario');
const { crearUsuarioAdmin, crearUsuarioCliente, crearAuto } = require('../helpers/authHelpers');

let mongod, tokenAdmin, tokenCliente;

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
  await Usuario.deleteMany({});
  await Auto.deleteMany({});
  await crearUsuarioAdmin();
  await crearUsuarioCliente();
  const resAdmin = await request(app).post('/api/auth/login').send({ email: 'admin@test.com', contraseña: 'Admin1234' });
  const resCliente = await request(app).post('/api/auth/login').send({ email: 'cliente@test.com', contraseña: 'Cliente1234' });
  tokenAdmin = resAdmin.body.data?.token;
  tokenCliente = resCliente.body.data?.token;
});

describe('Control de Flota - GET /api/autos', () => {
  test('obtiene lista vacía cuando no hay autos', async () => {
    const res = await request(app).get('/api/autos');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('obtiene lista de autos registrados', async () => {
    await crearAuto({ idAuto: 1 });
    await crearAuto({ idAuto: 2, marca: 'Honda', modelo: 'Civic' });
    const res = await request(app).get('/api/autos');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
  });
});

describe('Control de Flota - GET /api/autos/:id', () => {
  test('obtiene un auto por _id de MongoDB', async () => {
    const auto = await crearAuto({ idAuto: 10 });
    const res = await request(app).get(`/api/autos/${auto._id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(10);
  });

  test('retorna 404 para auto inexistente (ObjectId válido)', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/autos/${fakeId}`);
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe('Control de Flota - POST /api/autos', () => {
  test('crea un auto con datos completos', async () => {
    const res = await request(app).post('/api/autos').send({
      marca: 'Ford',
      modelo: 'Focus',
      año: 2021,
      tipoCoche: 'Compacto',
      precioDia: 80,
      matricula: 'XYZ-789',
      color: 'Azul',
      combustible: 'Gasolina',
      transmision: 'Manual',
      capacidad: 5
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
  });

  test('rechaza auto sin marca', async () => {
    const res = await request(app).post('/api/autos').send({
      modelo: 'Focus',
      año: 2021,
      tipoCoche: 'Compacto',
      precioDia: 80,
      matricula: 'DEF-456',
      combustible: 'Gasolina',
      transmision: 'Manual',
      capacidad: 5
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('rechaza tipo de vehículo inválido', async () => {
    const res = await request(app).post('/api/autos').send({
      marca: 'Ford',
      modelo: 'Focus',
      año: 2021,
      tipoCoche: 'TipoInvalido',
      precioDia: 80,
      matricula: 'GHI-123',
      combustible: 'Gasolina',
      transmision: 'Manual',
      capacidad: 5
    });
    expect([400, 500]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });
});

describe('Control de Flota - PUT /api/autos/:id', () => {
  test('actualiza datos de un auto existente', async () => {
    const auto = await crearAuto({ idAuto: 20 });
    const res = await request(app).put(`/api/autos/${auto._id}`).send({
      precioDia: 150,
      color: 'Negro'
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.precioDia).toBe(150);
  });

  test('retorna 404 al actualizar auto inexistente (ObjectId válido)', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).put(`/api/autos/${fakeId}`).send({ precioDia: 150 });
    expect(res.status).toBe(404);
  });
});

describe('Control de Flota - DELETE /api/autos/:id', () => {
  test('elimina un auto existente', async () => {
    const auto = await crearAuto({ idAuto: 30 });
    const res = await request(app).delete(`/api/autos/${auto._id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('retorna 404 al eliminar auto inexistente (ObjectId válido)', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).delete(`/api/autos/${fakeId}`);
    expect(res.status).toBe(404);
  });
});

describe('Control de Flota - GET /api/autos/search', () => {
  beforeEach(async () => {
    await crearAuto({ idAuto: 40, tipoCoche: 'SUV', disponible: true, precioDia: 200 });
    await crearAuto({ idAuto: 41, tipoCoche: 'Sedan', disponible: false, precioDia: 100 });
    await crearAuto({ idAuto: 42, tipoCoche: 'Compacto', disponible: true, precioDia: 70 });
  });

  test('filtra autos disponibles', async () => {
    const res = await request(app).get('/api/autos/search?disponible=true');
    expect(res.status).toBe(200);
    expect(res.body.data.every(a => a.disponible === true)).toBe(true);
  });

  test('filtra por tipo de vehículo', async () => {
    const res = await request(app).get('/api/autos/search?tipoCoche=SUV');
    expect(res.status).toBe(200);
    expect(res.body.data.every(a => a.tipoCoche === 'SUV' || a.tipo === 'SUV')).toBe(true);
  });
});

describe('Control de Flota - Catálogo público', () => {
  test('GET /api/catalogo devuelve autos disponibles', async () => {
    await crearAuto({ idAuto: 50 });
    const res = await request(app).get('/api/catalogo');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
