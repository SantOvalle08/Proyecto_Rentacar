const { Given, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');
const mongoose = require('mongoose');
const Usuario = require('../../src/models/usuario');
const Auto = require('../../src/models/Auto');

// ── DB cleanup ────────────────────────────────────────────────────────────────

Given('que la base de datos está limpia', async function () {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// ── Shared vehicle setup ──────────────────────────────────────────────────────

Given('existe un vehículo disponible con idAuto {int} y precio por día de {int}', async function (idAuto, precio) {
  this.autoId = idAuto;
  this.auto = await Auto.create({
    idAuto,
    marca: 'Toyota',
    modelo: 'Corolla',
    año: 2022,
    tipoCoche: 'Sedan',
    precioDia: precio,
    disponible: true,
    estadoVehiculo: 'disponible',
    matricula: `MAT-${idAuto}`
  });
  this.autoDoc = this.auto;
});

// ── Shared auth setup ─────────────────────────────────────────────────────────

Given('existe un cliente autenticado', async function () {
  this.usuarioDoc = await Usuario.create({
    idUser: 7001,
    nombre: 'Cliente BDD',
    email: 'cliente.bdd@test.com',
    contraseña: 'Cliente123',
    rol: 'cliente'
  });
  const res = await this.post('/api/auth/login', { email: 'cliente.bdd@test.com', contraseña: 'Cliente123' });
  this.clienteToken = res.body.data?.token;
  this.token = this.clienteToken;
});

Given('existe un administrador autenticado', async function () {
  this.adminUser = await Usuario.create({
    idUser: 6001,
    nombre: 'Admin BDD',
    email: 'admin.bdd@test.com',
    contraseña: 'Admin123',
    rol: 'admin'
  });
  const res = await this.post('/api/auth/login', { email: 'admin.bdd@test.com', contraseña: 'Admin123' });
  this.adminToken = res.body.data?.token;
  this.token = this.adminToken;
});

// ── Shared response assertions ────────────────────────────────────────────────

Then('el sistema debe responder con estado {int}', function (status) {
  expect(this.response.status).to.equal(status);
});

Then('el body de respuesta debe tener success en false', function () {
  expect(this.response.body.success).to.equal(false);
});
