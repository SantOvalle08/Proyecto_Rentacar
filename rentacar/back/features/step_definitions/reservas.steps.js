const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');
const Auto = require('../../src/models/Auto');
const Reserva = require('../../src/models/Reserva');
const Catalogo = require('../../src/models/Catalogo');

const diasDespues = (n) => new Date(Date.now() + n * 86400000).toISOString();


Given('que el vehículo {int} no está disponible', async function (idAuto) {
  await Auto.findOneAndUpdate({ idAuto }, { disponible: false });
});

Given('que existe una reserva con idReserva {int}', async function (idReserva) {
  this.reservaId = idReserva;
  await Reserva.create({
    idReserva,
    fechaInicio: new Date(Date.now() + 86400000),
    fechaFin: new Date(Date.now() + 3 * 86400000),
    estado: 'Pendiente',
    usuario: this.usuarioDoc._id,
    auto: this.auto._id,
    precioTotal: 300
  });
});

Given('que el cliente tiene {int} reservas registradas', async function (cantidad) {
  for (let i = 0; i < cantidad; i++) {
    await Reserva.create({
      idReserva: 2000 + i,
      fechaInicio: new Date(Date.now() + (i + 1) * 86400000),
      fechaFin: new Date(Date.now() + (i + 3) * 86400000),
      estado: 'Pendiente',
      usuario: this.usuarioDoc._id,
      auto: this.auto._id,
      precioTotal: 200
    });
  }
});

When('el cliente crea una reserva para el vehículo {int} del día siguiente por {int} días', async function (idAuto, dias) {
  await this.post('/api/reservas', {
    fechaInicio: diasDespues(1),
    fechaFin: diasDespues(1 + dias),
    usuario: this.usuarioDoc._id.toString(),
    autoId: idAuto
  }, this.clienteToken);
});

When('el cliente intenta reservar el vehículo {int} por {int} días', async function (idAuto, dias) {
  await this.post('/api/reservas', {
    fechaInicio: diasDespues(1),
    fechaFin: diasDespues(1 + dias),
    usuario: this.usuarioDoc._id.toString(),
    autoId: idAuto
  }, this.clienteToken);
});

When('el cliente intenta crear una reserva con fecha de inicio posterior a fecha de fin', async function () {
  await this.post('/api/reservas', {
    fechaInicio: diasDespues(5),
    fechaFin: diasDespues(1),
    usuario: this.usuarioDoc._id.toString(),
    autoId: this.autoId
  }, this.clienteToken);
});

When('el cliente solicita los detalles de la reserva {int}', async function (idReserva) {
  await this.get(`/api/reservas/${idReserva}`, this.clienteToken);
});

When('el cliente cancela la reserva {int}', async function (idReserva) {
  await this.put(`/api/reservas/${idReserva}/cancelar`, {}, this.clienteToken);
});

When('el cliente solicita calcular el precio para el vehículo {int} por {int} días', async function (idAuto, dias) {
  await this.post('/api/reservas/calcular-precio', {
    fechaInicio: diasDespues(1),
    fechaFin: diasDespues(1 + dias),
    autoId: idAuto
  }, this.clienteToken);
});

When('el cliente solicita la factura de la reserva {int}', async function (idReserva) {
  await this.get(`/api/reservas/${idReserva}/factura`, this.clienteToken);
});

When('el cliente solicita ver sus reservas', async function () {
  await this.get(`/api/usuarios/${this.usuarioDoc._id}/reservas`, this.clienteToken);
});

Then('la reserva debe tener estado {string}', function (estado) {
  const reserva = this.response.body.data?.reserva || this.response.body.data;
  expect(reserva.estado).to.equal(estado);
});

Then('el precio total debe ser mayor a {int}', function (valor) {
  const precio = this.response.body.data?.precioTotal || this.response.body.data?.precioBase;
  expect(precio).to.be.greaterThan(valor);
});

Then('el descuento aplicado debe ser {int}', function (descuento) {
  expect(this.response.body.data.descuento).to.equal(descuento);
});

Then('el mensaje debe indicar que el auto no está disponible', function () {
  expect(this.response.body.message.toLowerCase()).to.include('disponible');
});

Then('el mensaje debe indicar error en las fechas', function () {
  const msg = this.response.body.message || '';
  expect(msg).to.match(/fecha|anterior/i);
});

Then('los detalles deben incluir fechas, estado y precio total', function () {
  const data = this.response.body.data;
  expect(data).to.have.property('fechaInicio');
  expect(data).to.have.property('fechaFin');
  expect(data).to.have.property('estado');
  expect(data).to.have.property('precioTotal');
});

Then('el vehículo debe quedar disponible nuevamente', async function () {
  const auto = await Auto.findOne({ idAuto: this.autoId });
  expect(auto.disponible).to.equal(true);
});

Then('la respuesta debe incluir precio base, descuento y precio total', function () {
  const data = this.response.body.data;
  expect(data).to.have.property('precioBase');
  expect(data).to.have.property('descuento');
  expect(data).to.have.property('precioTotal');
});

Then('la factura debe incluir número, datos del cliente y monto total', function () {
  const data = this.response.body.data;
  expect(data).to.have.property('numeroFactura');
  expect(data).to.have.property('cliente');
  expect(data.detalles).to.have.property('total');
});

Then('la lista debe contener exactamente {int} reservas', function (cantidad) {
  expect(this.response.body.data.length).to.equal(cantidad);
});
