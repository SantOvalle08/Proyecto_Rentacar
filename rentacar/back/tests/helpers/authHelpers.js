const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Usuario = require('../../src/models/usuario');
const Auto = require('../../src/models/Auto');
const Reserva = require('../../src/models/Reserva');

// Ensure JWT_SECRET is available for tests. In CI this comes from the
// JWT_SECRET env var. Locally it falls back to a non-production test value.
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-jwt-secret-not-for-production';
}

const JWT_SECRET = process.env.JWT_SECRET;

const crearTokenAdmin = (userId, mongoId) =>
  jwt.sign({ id: mongoId, email: 'admin@test.com', rol: 'admin' }, JWT_SECRET, { expiresIn: '1h' });

const crearTokenCliente = (userId, mongoId) =>
  jwt.sign({ id: mongoId, email: 'cliente@test.com', rol: 'cliente' }, JWT_SECRET, { expiresIn: '1h' });

const crearUsuarioAdmin = async () => {
  return Usuario.create({
    idUser: 9001,
    nombre: 'Admin Test',
    email: 'admin@test.com',
    contraseña: 'Admin1234',
    rol: 'admin'
  });
};

const crearUsuarioCliente = async () => {
  return Usuario.create({
    idUser: 9002,
    nombre: 'Cliente Test',
    email: 'cliente@test.com',
    contraseña: 'Cliente1234',
    rol: 'cliente'
  });
};

const crearAuto = async (overrides = {}) =>
  Auto.create({
    idAuto:        overrides.idAuto        || 101,
    marca:         overrides.marca         || 'Toyota',
    modelo:        overrides.modelo        || 'Corolla',
    año:           overrides.año           || 2022,
    tipoCoche:     overrides.tipoCoche     || 'Sedan',
    precioDia:     overrides.precioDia     || 100,
    combustible:   overrides.combustible   || 'Gasolina',
    transmision:   overrides.transmision   || 'Automática',
    capacidad:     overrides.capacidad     || 5,
    disponible:    overrides.disponible    !== undefined ? overrides.disponible : true,
    estadoVehiculo: overrides.estadoVehiculo || 'disponible',
    color:         overrides.color         || 'Blanco',
    matricula:     overrides.matricula     || 'ABC-123',
  });

const crearReserva = async (autoId, usuarioId, overrides = {}) =>
  Reserva.create({
    idReserva: overrides.idReserva || 501,
    fechaInicio: overrides.fechaInicio || new Date(Date.now() + 86400000),
    fechaFin: overrides.fechaFin || new Date(Date.now() + 3 * 86400000),
    estado: overrides.estado || 'Pendiente',
    usuario: usuarioId,
    auto: autoId,
    precioTotal: overrides.precioTotal || 300
  });

module.exports = {
  JWT_SECRET,
  crearTokenAdmin,
  crearTokenCliente,
  crearUsuarioAdmin,
  crearUsuarioCliente,
  crearAuto,
  crearReserva
};
