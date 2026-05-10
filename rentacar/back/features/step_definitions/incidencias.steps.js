const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');
const bcrypt = require('bcrypt');
const Usuario = require('../../src/models/usuario');
const Auto = require('../../src/models/Auto');
const Reserva = require('../../src/models/Reserva');
const Incidencia = require('../../src/models/Incidencia');

Given('existe un vehículo disponible con idAuto {int}', async function (idAuto) {
  this.autoIdBDD = idAuto;
  if (!this.autoDoc) {
    this.autoDoc = await Auto.create({
      idAuto,
      marca: 'Honda',
      modelo: 'Civic',
      año: 2023,
      tipoCoche: 'Sedan',
      precioDia: 90,
      disponible: true,
      estadoVehiculo: 'disponible',
      matricula: `INC-${idAuto}`
    });
  }
});

Given('existe una reserva activa en estado Alquilado con idReserva {int}', async function (idReserva) {
  // world auth set by shared steps
  const reserva = await Reserva.create({
    idReserva,
    fechaInicio: new Date(Date.now() - 86400000),
    fechaFin: new Date(Date.now() + 2 * 86400000),
    estado: 'Confirmada',
    usuario: this.usuarioDoc._id,
    auto: this.autoDoc._id,
    precioTotal: 270
  });
  await this.post(`/api/reservas/${reserva.idReserva}/checkout`, { kmSalida: 20000, porcentajeGasolina: 100 }, this.adminToken);
  this.reservaActiva = await Reserva.findOne({ idReserva });
});

Given('que existe una reserva con idReserva {int} en estado Pendiente', async function (idReserva) {
  // world auth set by shared steps
  this.reservaPendiente = await Reserva.create({
    idReserva,
    fechaInicio: new Date(Date.now() + 86400000),
    fechaFin: new Date(Date.now() + 3 * 86400000),
    estado: 'Pendiente',
    usuario: this.usuarioDoc._id,
    auto: this.autoDoc._id,
    precioTotal: 270
  });
});

Given('que existen {int} incidencias registradas para la reserva {int}', async function (cantidad, idReserva) {
  for (let i = 0; i < cantidad; i++) {
    await Incidencia.create({
      idIncidencia: 1000 + i,
      reserva: this.reservaActiva._id,
      auto: this.autoDoc._id,
      tipo: 'Avería mecánica',
      descripcion: `Incidencia de prueba ${i + 1}`,
      fecha: new Date(),
      costoEstimado: 100
    });
  }
});

When('el cliente reporta una incidencia de tipo {string} con descripción {string} y costo estimado {int}', async function (tipo, descripcion, costo) {
  await this.post(`/api/reservas/${this.reservaActiva.idReserva}/incidencias`, {
    tipo,
    descripcion,
    costoEstimado: costo
  }, this.clienteToken);
});

When('el cliente reporta una incidencia de tipo {string} con descripción {string}', async function (tipo, descripcion) {
  await this.post(`/api/reservas/${this.reservaActiva.idReserva}/incidencias`, {
    tipo,
    descripcion
  }, this.clienteToken);
});

When('el cliente reporta una incidencia con observaciones {string}', async function (observaciones) {
  await this.post(`/api/reservas/${this.reservaActiva.idReserva}/incidencias`, {
    tipo: 'Accidente',
    descripcion: 'Incidencia con observaciones',
    observaciones
  }, this.clienteToken);
});

When('el cliente intenta reportar una incidencia sin tipo', async function () {
  await this.post(`/api/reservas/${this.reservaActiva.idReserva}/incidencias`, {
    descripcion: 'Sin tipo especificado'
  }, this.clienteToken);
});

When('el cliente intenta reportar una incidencia sin descripción', async function () {
  await this.post(`/api/reservas/${this.reservaActiva.idReserva}/incidencias`, {
    tipo: 'Avería mecánica'
  }, this.clienteToken);
});

When('el cliente intenta reportar incidencia en la reserva {int}', async function (idReserva) {
  await this.post(`/api/reservas/${idReserva}/incidencias`, {
    tipo: 'Avería mecánica',
    descripcion: 'Intentando en reserva pendiente'
  }, this.clienteToken);
});

When('el cliente consulta las incidencias de la reserva {int}', async function (idReserva) {
  await this.get(`/api/reservas/${idReserva}/incidencias`, this.clienteToken);
});

When('el cliente consulta las incidencias de la reserva {int} sin incidencias previas', async function (idReserva) {
  await Incidencia.deleteMany({});
  await this.get(`/api/reservas/${idReserva}/incidencias`, this.clienteToken);
});

When('el cliente reporta {int} incidencias distintas en la reserva {int}', async function (cantidad, idReserva) {
  const tipos = ['Accidente', 'Avería mecánica', 'Daño'];
  for (let i = 0; i < cantidad; i++) {
    await this.post(`/api/reservas/${idReserva}/incidencias`, {
      tipo: tipos[i % tipos.length],
      descripcion: `Incidencia número ${i + 1}`
    }, this.clienteToken);
  }
});

When('consulta las incidencias de la reserva {int}', async function (idReserva) {
  await this.get(`/api/reservas/${idReserva}/incidencias`, this.clienteToken);
});

When('un usuario no autenticado intenta reportar una incidencia en la reserva {int}', async function (idReserva) {
  await this.post(`/api/reservas/${idReserva}/incidencias`, {
    tipo: 'Avería mecánica',
    descripcion: 'Sin autenticación'
  });
});

When('el cliente reporta una incidencia sin especificar costo estimado', async function () {
  await this.post(`/api/reservas/${this.reservaActiva.idReserva}/incidencias`, {
    tipo: 'Avería mecánica',
    descripcion: 'Sin costo estimado'
  }, this.clienteToken);
});

Then('la incidencia debe quedar registrada con tipo {string}', function (tipo) {
  expect(this.response.body.data.tipo).to.equal(tipo);
});

Then('el costo estimado debe ser {int}', function (costo) {
  expect(this.response.body.data.costoEstimado).to.equal(costo);
});

Then('las observaciones deben estar registradas', function () {
  expect(this.response.body.data.observaciones).to.be.a('string');
});

Then('el mensaje debe indicar que tipo es requerido', function () {
  expect(this.response.body.message.toLowerCase()).to.include('requerido');
});

Then('el mensaje debe indicar que descripción es requerida', function () {
  expect(this.response.body.message.toLowerCase()).to.include('requerido');
});

Then('el mensaje debe indicar que solo se pueden reportar incidencias en reservas activas', function () {
  expect(this.response.body.message.toLowerCase()).to.include('activas');
});

Then('la lista debe contener {int} incidencias', function (cantidad) {
  expect(this.response.body.data.length).to.equal(cantidad);
});

Then('la lista debe estar vacía', function () {
  expect(this.response.body.data.length).to.equal(0);
});

Then('la lista debe contener las {int} incidencias registradas', function (cantidad) {
  expect(this.response.body.data.length).to.be.at.least(cantidad);
});

Then('el costo estimado debe ser {int} por defecto', function (costo) {
  expect(this.response.body.data.costoEstimado).to.equal(costo);
});
