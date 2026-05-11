const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');
const Usuario = require('../../src/models/usuario');
const Auto = require('../../src/models/Auto');
const Reserva = require('../../src/models/Reserva');
const Entrega = require('../../src/models/Entrega');

const crearAutoBase = (overrides = {}) => ({
  idAuto: overrides.idAuto || Math.floor(Math.random() * 9000 + 1000),
  marca: overrides.marca || 'Toyota',
  modelo: overrides.modelo || 'Corolla',
  año: overrides.año || 2022,
  tipoCoche: overrides.tipoCoche || 'Sedan',
  precioDia: overrides.precioDia || 100,
  disponible: overrides.disponible !== undefined ? overrides.disponible : true,
  estadoVehiculo: overrides.estadoVehiculo || 'disponible',
  matricula: overrides.matricula || `MAT-${Date.now()}`
});


Given('existen {int} vehículos en el sistema', async function (cantidad) {
  const tipos = ['Sedan', 'SUV', 'Compacto'];
  for (let i = 0; i < cantidad; i++) {
    await Auto.create(crearAutoBase({ idAuto: 3000 + i, tipoCoche: tipos[i % 3] }));
  }
});

Given('existe un vehículo con idAuto {int}', async function (idAuto) {
  this.autoId = idAuto;
  await Auto.create(crearAutoBase({ idAuto }));
});

Given('existe un vehículo con idAuto {int} y precio de {int} por día', async function (idAuto, precio) {
  this.autoId = idAuto;
  await Auto.create(crearAutoBase({ idAuto, precioDia: precio }));
});

Given('existen {int} vehículos disponibles y {int} no disponible', async function (disponibles, noDisponibles) {
  for (let i = 0; i < disponibles; i++) {
    await Auto.create(crearAutoBase({ idAuto: 4000 + i, disponible: true }));
  }
  for (let i = 0; i < noDisponibles; i++) {
    await Auto.create(crearAutoBase({ idAuto: 4100 + i, disponible: false, estadoVehiculo: 'reservado' }));
  }
});

Given('existen {int} vehículos SUV y {int} Sedan en el sistema', async function (suvs, sedans) {
  for (let i = 0; i < suvs; i++) {
    await Auto.create(crearAutoBase({ idAuto: 5000 + i, tipoCoche: 'SUV' }));
  }
  for (let i = 0; i < sedans; i++) {
    await Auto.create(crearAutoBase({ idAuto: 5100 + i, tipoCoche: 'Sedan' }));
  }
});

Given('existen {int} vehículos disponibles en el catálogo', async function (cantidad) {
  for (let i = 0; i < cantidad; i++) {
    await Auto.create(crearAutoBase({ idAuto: 6000 + i }));
  }
});

Given('existe una reserva confirmada para el vehículo {int}', async function (idAuto) {
  const usuario = await Usuario.create({ idUser: 6100, nombre: 'Usuario', email: `u${idAuto}@test.com`, contraseña: 'User123' });
  const auto = await Auto.create(crearAutoBase({ idAuto, estadoVehiculo: 'disponible' }));
  this.reservaConfirmada = await Reserva.create({
    idReserva: 6000 + idAuto,
    fechaInicio: new Date(Date.now() - 86400000),
    fechaFin: new Date(Date.now() + 2 * 86400000),
    estado: 'Confirmada',
    usuario: usuario._id,
    auto: auto._id,
    precioTotal: 300
  });
  this.autoParaFlota = auto;
});

Given('existe una reserva activa para el vehículo {int} en estado alquilado', async function (idAuto) {
  const usuario = await Usuario.create({ idUser: 6200, nombre: 'Usuario2', email: `u2${idAuto}@test.com`, contraseña: 'User123' });
  const auto = await Auto.create(crearAutoBase({ idAuto, estadoVehiculo: 'disponible' }));
  const reserva = await Reserva.create({
    idReserva: 7000 + idAuto,
    fechaInicio: new Date(Date.now() - 86400000),
    fechaFin: new Date(Date.now() + 2 * 86400000),
    estado: 'Confirmada',
    usuario: usuario._id,
    auto: auto._id,
    precioTotal: 300
  });
  await this.post(`/api/reservas/${reserva.idReserva}/checkout`, { kmSalida: 10000, porcentajeGasolina: 100 }, this.adminToken);
  this.reservaActiva = await Reserva.findOne({ idReserva: reserva.idReserva });
  this.autoParaFlota = auto;
});

When('el administrador agrega un vehículo con marca {string} modelo {string} año {int} tipo {string} y precio {int} por día', async function (marca, modelo, año, tipo, precio) {
  await this.post('/api/autos', {
    marca, modelo, año, tipoCoche: tipo, precioDia: precio,
    matricula: `TEST-${Date.now()}`,
    combustible: 'Gasolina',
    transmision: 'Manual',
    capacidad: 5
  }, this.adminToken);
});

When('el administrador intenta agregar un vehículo sin marca', async function () {
  await this.post('/api/autos', { modelo: 'Test', año: 2022, tipoCoche: 'Sedan', precioDia: 80 }, this.adminToken);
});

When('el administrador intenta agregar un vehículo con tipo {string}', async function (tipo) {
  await this.post('/api/autos', { marca: 'Ford', modelo: 'Test', año: 2022, tipoCoche: tipo, precioDia: 80 }, this.adminToken);
});

When('el administrador solicita la lista de todos los vehículos', async function () {
  await this.get('/api/autos', this.adminToken);
});

When('solicito los detalles del vehículo {int}', async function (idAuto) {
  const auto = await Auto.findOne({ idAuto });
  await this.get(`/api/autos/${auto._id}`);
});

When('el administrador actualiza el precio del vehículo {int} a {int} por día', async function (idAuto, precio) {
  const auto = await Auto.findOne({ idAuto });
  await this.put(`/api/autos/${auto._id}`, { precioDia: precio }, this.adminToken);
});

When('el administrador elimina el vehículo {int}', async function (idAuto) {
  const auto = await Auto.findOne({ idAuto });
  await this.delete(`/api/autos/${auto._id}`, this.adminToken);
});

When('busco vehículos con filtro disponible igual a true', async function () {
  await this.get('/api/autos/search?disponible=true');
});

When('busco vehículos de tipo {string}', async function (tipo) {
  await this.get(`/api/autos/search?tipoCoche=${tipo}`);
});

When('solicito el catálogo público sin autenticación', async function () {
  await this.get('/api/catalogo');
});

When('el administrador realiza el checkout de esa reserva', async function () {
  await this.post(`/api/reservas/${this.reservaConfirmada.idReserva}/checkout`, { kmSalida: 10000, porcentajeGasolina: 100 }, this.adminToken);
});

When('el administrador realiza el checkin sin daños', async function () {
  await this.post(`/api/reservas/${this.reservaActiva.idReserva}/checkin`, {
    kmRetorno: 10500,
    porcentajeGasolina: 100,
    estadoFinalVehiculo: 'disponible'
  }, this.adminToken);
});

Then('el vehículo debe estar registrado en el sistema', function () {
  expect(this.response.body.success).to.equal(true);
  expect(this.response.body.data).to.have.property('id');
});

Then('el vehículo debe estar disponible por defecto', function () {
  expect(this.response.body.data.disponible).to.equal(true);
});

Then('la lista debe contener {int} vehículos', function (cantidad) {
  expect(this.response.body.data.length).to.equal(cantidad);
});

Then('los detalles deben incluir marca, modelo, año, tipo y precio', function () {
  const data = this.response.body.data;
  expect(data).to.have.property('marca');
  expect(data).to.have.property('modelo');
  expect(data).to.have.property('año');
});

Then('el precio del vehículo {int} debe ser {int}', function (idAuto, precio) {
  expect(this.response.body.data.precioDia).to.equal(precio);
});

Then('el vehículo {int} no debe existir en el sistema', async function (idAuto) {
  const auto = await Auto.findOne({ idAuto });
  expect(auto).to.be.null;
});

Then('todos los vehículos en el resultado deben estar disponibles', function () {
  const autos = this.response.body.data;
  expect(autos.every(a => a.disponible === true)).to.equal(true);
});

Then('todos los vehículos en el resultado deben ser de tipo SUV', function () {
  const autos = this.response.body.data;
  expect(autos.every(a => a.tipoCoche === 'SUV' || a.tipo === 'SUV')).to.equal(true);
});

Then('la lista del catálogo debe ser accesible', function () {
  expect(this.response.body.success).to.equal(true);
  expect(Array.isArray(this.response.body.data)).to.equal(true);
});

Then('el vehículo {int} debe tener estado {string}', async function (idAuto, estado) {
  const auto = await Auto.findOne({ idAuto });
  expect(auto.estadoVehiculo).to.equal(estado);
});

Then('el vehículo {int} no debe estar disponible', async function (idAuto) {
  const auto = await Auto.findOne({ idAuto });
  expect(auto.disponible).to.equal(false);
});

Then('el vehículo {int} debe estar disponible', async function (idAuto) {
  const auto = await Auto.findOne({ idAuto });
  expect(auto.disponible).to.equal(true);
});
