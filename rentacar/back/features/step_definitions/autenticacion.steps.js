const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');
const Usuario = require('../../src/models/usuario');

Given('que no existe un usuario con el email {string}', async function (email) {
  await Usuario.deleteMany({ email });
});

Given('que ya existe un usuario con email {string}', async function (email) {
  await Usuario.create({ idUser: Date.now(), nombre: 'Existente', email, contraseña: 'Clave123' });
});

Given('que existe un usuario con email {string} y contraseña {string}', async function (email, contraseña) {
  await Usuario.create({ idUser: Date.now(), nombre: 'Usuario Test', email, contraseña, rol: 'cliente' });
});

When('envío una solicitud de registro con nombre {string} email {string} y contraseña {string}', async function (nombre, email, contraseña) {
  await this.post('/api/auth/register', { nombre, email, contraseña });
});

When('envío una solicitud de registro sin nombre con email {string} y contraseña {string}', async function (email, contraseña) {
  await this.post('/api/auth/register', { email, contraseña });
});

When('envío una solicitud de login con email {string} y contraseña {string}', async function (email, contraseña) {
  await this.post('/api/auth/login', { email, contraseña });
});

When('realizo una solicitud GET a {string} sin token', async function (path) {
  await this.get(path);
});

When('el cliente realiza una solicitud GET a {string}', async function (path) {
  await this.get(path, this.clienteToken);
});

When('el administrador realiza una solicitud GET a {string}', async function (path) {
  await this.get(path, this.adminToken);
});

Then('el mensaje de respuesta debe contener {string}', function (texto) {
  const msg = this.response.body.message || '';
  expect(msg).to.include(texto);
});

Then('la respuesta debe contener un token JWT', function () {
  expect(this.response.body.data).to.have.property('token');
  expect(this.response.body.data.token).to.be.a('string');
});

Then('los datos del usuario deben contener el email {string}', function (email) {
  expect(this.response.body.data.usuario.email).to.equal(email);
});

Then('el mensaje debe indicar que se requiere rol de administrador', function () {
  const msg = this.response.body.message || '';
  expect(msg.toLowerCase()).to.include('administrador');
});

Then('la respuesta debe ser una lista de usuarios', function () {
  expect(Array.isArray(this.response.body.data)).to.equal(true);
});
