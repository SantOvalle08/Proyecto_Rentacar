const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../setup/testApp');
const Usuario = require('../../src/models/usuario');
const { crearUsuarioAdmin, crearUsuarioCliente } = require('../helpers/authHelpers');

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
});

afterEach(async () => {
  await Usuario.deleteMany({});
});

describe('Autenticación - POST /api/auth/register', () => {
  test('registra un usuario nuevo con datos válidos', async () => {
    const res = await request(app).post('/api/auth/register').send({
      nombre: 'Juan',
      apellido: 'Pérez',
      email: 'juan@test.com',
      contraseña: 'Password123'
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('éxito');
  });

  test('rechaza registro sin nombre', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'juan@test.com',
      contraseña: 'Password123'
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('rechaza registro sin email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      nombre: 'Juan',
      contraseña: 'Password123'
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('rechaza registro sin contraseña', async () => {
    const res = await request(app).post('/api/auth/register').send({
      nombre: 'Juan',
      email: 'juan@test.com'
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('rechaza email duplicado', async () => {
    await request(app).post('/api/auth/register').send({
      nombre: 'Juan',
      email: 'juan@test.com',
      contraseña: 'Password123'
    });
    const res = await request(app).post('/api/auth/register').send({
      nombre: 'Juan Dos',
      email: 'juan@test.com',
      contraseña: 'Password456'
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('registrado');
  });
});

describe('Autenticación - POST /api/auth/login', () => {
  beforeEach(async () => {
    await crearUsuarioCliente();
  });

  test('inicia sesión con credenciales válidas', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'cliente@test.com',
      contraseña: 'Cliente1234'
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data).toHaveProperty('usuario');
    expect(res.body.data.usuario.email).toBe('cliente@test.com');
  });

  test('rechaza login sin email', async () => {
    const res = await request(app).post('/api/auth/login').send({
      contraseña: 'Cliente1234'
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('rechaza login sin contraseña', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'cliente@test.com'
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('rechaza contraseña incorrecta', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'cliente@test.com',
      contraseña: 'WrongPassword'
    });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('rechaza email no registrado', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'noexiste@test.com',
      contraseña: 'Password123'
    });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('login es case-insensitive en el email', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'CLIENTE@TEST.COM',
      contraseña: 'Cliente1234'
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('Autenticación - Acceso protegido', () => {
  let tokenAdmin, tokenCliente;

  beforeEach(async () => {
    const admin = await crearUsuarioAdmin();
    const cliente = await crearUsuarioCliente();
    const resAdmin = await request(app).post('/api/auth/login').send({ email: 'admin@test.com', contraseña: 'Admin1234' });
    const resCliente = await request(app).post('/api/auth/login').send({ email: 'cliente@test.com', contraseña: 'Cliente1234' });
    tokenAdmin = resAdmin.body.data?.token;
    tokenCliente = resCliente.body.data?.token;
  });

  test('rechaza acceso sin token', async () => {
    const res = await request(app).get('/api/usuarios');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('rechaza token malformado', async () => {
    const res = await request(app).get('/api/usuarios').set('Authorization', 'Bearer token_invalido');
    expect(res.status).toBe(401);
  });

  test('admin accede a lista de usuarios', async () => {
    const res = await request(app).get('/api/usuarios').set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('cliente no puede acceder a lista de usuarios (solo admin)', async () => {
    const res = await request(app).get('/api/usuarios').set('Authorization', `Bearer ${tokenCliente}`);
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
