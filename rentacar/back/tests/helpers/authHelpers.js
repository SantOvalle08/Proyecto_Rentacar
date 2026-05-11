const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Usuario = require('../../src/models/usuario');
const Auto = require('../../src/models/Auto');
const Reserva = require('../../src/models/Reserva');

const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';

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
    idAuto: overrides.idAuto || 101,
    marca: overrides.marca || 'Toyota',
    modelo: overrides.modelo || 'Corolla',
    año: overrides.año || 2022,
    tipoCoche: overrides.tipoCoche || 'Sedan',
    precioDia: overrides.precioDia || 100,
    disponible: overrides.disponible !== undefined ? overrides.disponible : true,
    estadoVehiculo: overrides.estadoVehiculo || 'disponible',
    color: overrides.color || 'Blanco',
    matricula: overrides.matricula || 'ABC-123'
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
