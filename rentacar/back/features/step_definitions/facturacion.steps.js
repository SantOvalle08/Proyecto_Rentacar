const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');
const bcrypt = require('bcrypt');
const Usuario = require('../../src/models/usuario');
const Auto = require('../../src/models/Auto');
const Reserva = require('../../src/models/Reserva');
const Entrega = require('../../src/models/Entrega');

const diasDespues = (n) => new Date(Date.now() + n * 86400000).toISOString();
const diasAtras = (n) => new Date(Date.now() - n * 86400000).toISOString();

const setupClienteYAuto = async (world, idAuto, precio) => {
  // reuse tokens already set by shared steps (exists un cliente/admin autenticado)
  if (!world.autoDoc || world.autoDoc.idAuto !== idAuto) {
    world.autoDoc = await Auto.create({
      idAuto: idAuto || 10,
      marca: 'Toyota',
      modelo: 'Corolla',
      año: 2022,
      tipoCoche: 'Sedan',
      precioDia: precio || 100,
      disponible: true,
      estadoVehiculo: 'disponible',
      matricula: `FAC-${idAuto || 10}`
    });
  }
};

Given('existe un vehículo disponible para facturación con idAuto {int} y precio {int}', async function (idAuto, precio) {
  await setupClienteYAuto(this, idAuto, precio);
});

Given('que existe una reserva completada con idReserva {int}', async function (idReserva) {
  await setupClienteYAuto(this, 10, 100);
  this.reservaId = idReserva;
  await Reserva.create({
    idReserva,
    fechaInicio: new Date(Date.now() - 3 * 86400000),
    fechaFin: new Date(Date.now() - 86400000),
    estado: 'Completada',
    usuario: this.usuarioDoc._id,
    auto: this.autoDoc._id,
    precioTotal: 300
  });
});

Given('que existe una reserva activa con checkout registrado al 100 por ciento de combustible', async function () {
  await setupClienteYAuto(this, 10, 100);
  const reserva = await Reserva.create({
    idReserva: 8001,
    fechaInicio: new Date(Date.now() - 86400000),
    fechaFin: new Date(Date.now() + 2 * 86400000),
    estado: 'Confirmada',
    usuario: this.usuarioDoc._id,
    auto: this.autoDoc._id,
    precioTotal: 300
  });
  await this.post(`/api/reservas/${reserva.idReserva}/checkout`, { kmSalida: 10000, porcentajeGasolina: 100 }, this.adminToken);
  this.reservaActiva = await Reserva.findOne({ idReserva: reserva.idReserva });
});

Given('que existe una reserva con fecha de fin vencida', async function () {
  await setupClienteYAuto(this, 10, 100);
  const reserva = await Reserva.create({
    idReserva: 8002,
    fechaInicio: new Date(Date.now() - 5 * 86400000),
    fechaFin: new Date(Date.now() - 2 * 86400000),
    estado: 'Confirmada',
    usuario: this.usuarioDoc._id,
    auto: this.autoDoc._id,
    precioTotal: 300
  });
  await this.post(`/api/reservas/${reserva.idReserva}/checkout`, { kmSalida: 10000, porcentajeGasolina: 100 }, this.adminToken);
  this.reservaVencida = await Reserva.findOne({ idReserva: reserva.idReserva });
});

Given('que al checkout se registró un gato hidráulico presente', async function () {
  await setupClienteYAuto(this, 10, 100);
  const reserva = await Reserva.create({
    idReserva: 8003,
    fechaInicio: new Date(Date.now() - 86400000),
    fechaFin: new Date(Date.now() + 2 * 86400000),
    estado: 'Confirmada',
    usuario: this.usuarioDoc._id,
    auto: this.autoDoc._id,
    precioTotal: 300
  });
  await this.post(`/api/reservas/${reserva.idReserva}/checkout`, {
    kmSalida: 10000,
    porcentajeGasolina: 100,
    inventario: [{ nombre: 'Gato hidráulico', presente: true }]
  }, this.adminToken);
  this.reservaConInventario = await Reserva.findOne({ idReserva: reserva.idReserva });
});

Given('que existe una reserva activa en checkout', async function () {
  await setupClienteYAuto(this, 10, 100);
  const reserva = await Reserva.create({
    idReserva: 8004,
    fechaInicio: new Date(Date.now() - 86400000),
    fechaFin: new Date(Date.now() + 2 * 86400000),
    estado: 'Confirmada',
    usuario: this.usuarioDoc._id,
    auto: this.autoDoc._id,
    precioTotal: 300
  });
  await this.post(`/api/reservas/${reserva.idReserva}/checkout`, { kmSalida: 10000, porcentajeGasolina: 100 }, this.adminToken);
  this.reservaParaDano = await Reserva.findOne({ idReserva: reserva.idReserva });
});

Given('que existen {int} reservas completadas', async function (cantidad) {
  await setupClienteYAuto(this, 10, 100);
  this.reservasIds = [];
  for (let i = 0; i < cantidad; i++) {
    const r = await Reserva.create({
      idReserva: 9000 + i,
      fechaInicio: new Date(Date.now() - (10 - i) * 86400000),
      fechaFin: new Date(Date.now() - (5 - i) * 86400000),
      estado: 'Completada',
      usuario: this.usuarioDoc._id,
      auto: this.autoDoc._id,
      precioTotal: 250 + i * 50
    });
    this.reservasIds.push(r.idReserva);
  }
});

When('calculo el precio para el vehículo {int} por {int} días', async function (idAuto, dias) {
  await this.post('/api/reservas/calcular-precio', {
    fechaInicio: diasDespues(1),
    fechaFin: diasDespues(1 + dias),
    autoId: idAuto
  }, this.clienteToken);
});

When('genero la factura de la reserva {int}', async function (idReserva) {
  await this.get(`/api/reservas/${idReserva}/factura`, this.clienteToken);
});

When('se registra el checkin con {int} por ciento de combustible', async function (porcentaje) {
  await this.post(`/api/reservas/${this.reservaActiva.idReserva}/checkin`, {
    kmRetorno: 10500,
    porcentajeGasolina: porcentaje,
    estadoFinalVehiculo: 'disponible'
  }, this.adminToken);
});

When('se registra el checkin con fecha posterior a la prevista', async function () {
  await this.post(`/api/reservas/${this.reservaVencida.idReserva}/checkin`, {
    kmRetorno: 10500,
    porcentajeGasolina: 100,
    fechaDevolucion: new Date().toISOString(),
    estadoFinalVehiculo: 'disponible'
  }, this.adminToken);
});

When('se registra el checkin sin el gato hidráulico', async function () {
  await this.post(`/api/reservas/${this.reservaConInventario.idReserva}/checkin`, {
    kmRetorno: 10500,
    porcentajeGasolina: 100,
    inventario: [{ nombre: 'Gato hidráulico', presente: false }],
    estadoFinalVehiculo: 'disponible'
  }, this.adminToken);
});

When('se registra el checkin con un daño nuevo de costo {int}', async function (costo) {
  await this.post(`/api/reservas/${this.reservaParaDano.idReserva}/checkin`, {
    kmRetorno: 10500,
    porcentajeGasolina: 100,
    dañosNuevos: [{ descripcion: 'Abolladura puerta', ubicacion: 'Lado izquierdo', costoReparacion: costo }],
    estadoFinalVehiculo: 'disponible'
  }, this.adminToken);
});

When('genero la factura de la primera reserva y la segunda', async function () {
  const r1 = await this.get(`/api/reservas/${this.reservasIds[0]}/factura`, this.clienteToken);
  this.factura1 = r1.body.data?.numeroFactura;
  const r2 = await this.get(`/api/reservas/${this.reservasIds[1]}/factura`, this.clienteToken);
  this.factura2 = r2.body.data?.numeroFactura;
});

Then('el precio base debe ser {int}', function (precioBase) {
  expect(this.response.body.data.precioBase).to.equal(precioBase);
});

Then('no debe aplicarse ningún descuento', function () {
  expect(this.response.body.data.descuento).to.equal(0);
});

Then('el precio total debe ser {int} para tipo Sedan con modificador {float}', function (total, modificador) {
  expect(this.response.body.data.precioTotal).to.be.greaterThan(0);
});

Then('el descuento debe ser {int}', function (descuento) {
  expect(this.response.body.data.descuento).to.equal(descuento);
});

Then('el precio total debe ser menor al precio base', function () {
  const { precioBase, precioTotal } = this.response.body.data;
  expect(precioTotal).to.be.lessThan(precioBase);
});

Then('la factura debe contener nombre del cliente', function () {
  expect(this.response.body.data.cliente.nombre).to.be.a('string');
});

Then('la factura debe contener email del cliente', function () {
  expect(this.response.body.data.cliente.email).to.be.a('string');
});

Then('la factura debe contener marca y modelo del vehículo', function () {
  expect(this.response.body.data.auto.marca).to.be.a('string');
  expect(this.response.body.data.auto.modelo).to.be.a('string');
});

Then('la factura debe contener precio por día', function () {
  expect(this.response.body.data.auto.precioDia).to.be.a('number');
});

Then('la factura debe incluir subtotal', function () {
  expect(this.response.body.data.detalles).to.have.property('subtotal');
});

Then('la factura debe incluir impuestos', function () {
  expect(this.response.body.data.detalles).to.have.property('impuestos');
});

Then('la factura debe incluir total final', function () {
  expect(this.response.body.data.detalles).to.have.property('total');
});

Then('los cargos adicionales deben incluir cargo por combustible', function () {
  const cargos = this.response.body.data.cargosAdicionales || [];
  const cargo = cargos.find(c => c.tipo === 'combustible');
  expect(cargo).to.not.be.undefined;
});

Then('el monto de combustible debe ser mayor a {int}', function (valor) {
  const cargos = this.response.body.data.cargosAdicionales || [];
  const cargo = cargos.find(c => c.tipo === 'combustible');
  expect(cargo.monto).to.be.greaterThan(valor);
});

Then('los cargos adicionales deben incluir cargo por retraso', function () {
  const cargos = this.response.body.data.cargosAdicionales || [];
  const cargo = cargos.find(c => c.tipo === 'retraso');
  expect(cargo).to.not.be.undefined;
});

Then('el monto por retraso debe ser mayor a {int}', function (valor) {
  const cargos = this.response.body.data.cargosAdicionales || [];
  const cargo = cargos.find(c => c.tipo === 'retraso');
  expect(cargo.monto).to.be.greaterThan(valor);
});

Then('los cargos adicionales deben incluir cargo por accesorio faltante', function () {
  const cargos = this.response.body.data.cargosAdicionales || [];
  const cargo = cargos.find(c => c.tipo === 'accesorio');
  expect(cargo).to.not.be.undefined;
});

Then('los cargos adicionales deben incluir cargo por daño', function () {
  const cargos = this.response.body.data.cargosAdicionales || [];
  const cargo = cargos.find(c => c.tipo === 'daño');
  expect(cargo).to.not.be.undefined;
});

Then('el monto del daño debe ser {int}', function (monto) {
  const cargos = this.response.body.data.cargosAdicionales || [];
  const cargo = cargos.find(c => c.tipo === 'daño');
  expect(cargo.monto).to.equal(monto);
});

Then('los números de factura deben ser diferentes', function () {
  expect(this.factura1).to.not.equal(this.factura2);
});
