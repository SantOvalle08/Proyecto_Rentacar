const Reserva = require('../models/Reserva');
const Auto = require('../models/Auto');
const Entrega = require('../models/Entrega');
const Devolucion = require('../models/Devolucion');
const Incidencia = require('../models/Incidencia');
const Checklist = require('../models/Checklist');

// --- helpers ---

const nextId = async (Model, field) => {
  const last = await Model.findOne().sort({ [field]: -1 }).select(field);
  return (last?.[field] || 0) + 1;
};

// Calculates additional charges by comparing checkout vs return state
const calcularCargosAdicionales = (entrega, devolucionData, reserva) => {
  const cargos = [];
  const auto = reserva.auto;

  // Fuel: charge if return level is more than 5% below checkout level
  const gasDiff = entrega.porcentajeGasolina - devolucionData.porcentajeGasolina;
  if (gasDiff > 5) {
    cargos.push({
      concepto: `Combustible faltante (${gasDiff.toFixed(0)}% menos que al salir)`,
      monto: Math.round(gasDiff * auto.precioDia * 0.015),
      tipo: 'combustible'
    });
  }

  // Late return: charge 1.5x daily rate per extra day
  const fechaFinPrevista = new Date(reserva.fechaFin);
  const fechaDevolucion = new Date(devolucionData.fechaDevolucion || Date.now());
  if (fechaDevolucion > fechaFinPrevista) {
    const msExtra = fechaDevolucion - fechaFinPrevista;
    const diasExtra = Math.ceil(msExtra / (1000 * 60 * 60 * 24));
    cargos.push({
      concepto: `Retraso en devolución (${diasExtra} día(s) adicional(es))`,
      monto: diasExtra * auto.precioDia * 1.5,
      tipo: 'retraso'
    });
  }

  // Missing accessories
  if (devolucionData.inventario && entrega.inventario) {
    entrega.inventario.forEach(itemSalida => {
      const itemRetorno = devolucionData.inventario.find(i => i.nombre === itemSalida.nombre);
      if (itemSalida.presente && (!itemRetorno || !itemRetorno.presente)) {
        cargos.push({
          concepto: `Accesorio faltante: ${itemSalida.nombre}`,
          monto: Math.round(auto.precioDia * 0.5),
          tipo: 'accesorio'
        });
      }
    });
  }

  // New damages with cost
  if (devolucionData.dañosNuevos) {
    devolucionData.dañosNuevos.forEach(daño => {
      if (daño.costoReparacion > 0) {
        cargos.push({
          concepto: `Daño nuevo: ${daño.descripcion} (${daño.ubicacion})`,
          monto: daño.costoReparacion,
          tipo: 'daño'
        });
      }
    });
  }

  return cargos;
};

// --- controller ---

const entregaController = {

  // POST /api/reservas/:id/checkout
  async checkout(req, res) {
    try {
      const { id } = req.params;

      const reserva = await Reserva.findOne({ idReserva: id })
        .populate('auto')
        .populate('usuario', '-contraseña');

      if (!reserva) {
        return res.status(404).json({ success: false, message: 'Reserva no encontrada' });
      }

      if (reserva.estado !== 'Confirmada') {
        return res.status(400).json({
          success: false,
          message: `Solo se puede hacer check-out de reservas Confirmadas. Estado actual: ${reserva.estado}`
        });
      }

      const existente = await Entrega.findOne({ reserva: reserva._id });
      if (existente) {
        return res.status(400).json({ success: false, message: 'Esta reserva ya tiene un check-out registrado' });
      }

      const {
        kmSalida,
        nivelGasolina,
        porcentajeGasolina,
        inventario,
        dañosPreExistentes,
        estadoGeneral,
        observaciones,
        verificacionCliente
      } = req.body;

      if (kmSalida === undefined || kmSalida === null) {
        return res.status(400).json({ success: false, message: 'El kilometraje de salida es requerido' });
      }

      const entrega = new Entrega({
        idEntrega: await nextId(Entrega, 'idEntrega'),
        reserva: reserva._id,
        auto: reserva.auto._id,
        fechaEntrega: new Date(),
        verificacionCliente: verificacionCliente || {},
        kmSalida,
        nivelGasolina: nivelGasolina || 'Lleno',
        porcentajeGasolina: porcentajeGasolina ?? 100,
        inventario: inventario || [],
        dañosPreExistentes: dañosPreExistentes || [],
        estadoGeneral: estadoGeneral || 'Bueno',
        observaciones: observaciones || '',
        realizadoPor: req.user?.id
      });

      await entrega.save();

      // Transition states
      reserva.estado = 'Alquilado';
      await reserva.save();

      const auto = reserva.auto;
      await Auto.updateOne(
        { _id: auto._id },
        { disponible: false, estadoVehiculo: 'alquilado' }
      );

      // Sync checklist to reflect delivery state
      try {
        let checklist = await Checklist.findOne({ autoId: auto._id });
        if (checklist) {
          checklist.nivelGasolina = nivelGasolina || checklist.nivelGasolina;
          checklist.porcentajeGasolina = porcentajeGasolina ?? checklist.porcentajeGasolina;
          if (estadoGeneral) checklist.estadoGeneral = estadoGeneral;
          if (dañosPreExistentes?.length) {
            checklist.rayones = dañosPreExistentes.map(d => ({
              descripcion: d.descripcion,
              ubicacion: d.ubicacion
            }));
          }
          await checklist.save();
        }
      } catch (e) {
        // non-blocking
        console.warn('No se pudo sincronizar el checklist en checkout:', e.message);
      }

      res.status(201).json({
        success: true,
        message: 'Check-out registrado. El vehículo está ahora alquilado.',
        data: { entrega, reservaEstado: 'Alquilado' }
      });
    } catch (error) {
      console.error('Error en checkout:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
    }
  },

  // GET /api/reservas/:id/checkout
  async getCheckout(req, res) {
    try {
      const { id } = req.params;

      const reserva = await Reserva.findOne({ idReserva: id });
      if (!reserva) {
        return res.status(404).json({ success: false, message: 'Reserva no encontrada' });
      }

      const entrega = await Entrega.findOne({ reserva: reserva._id })
        .populate('auto')
        .populate('realizadoPor', '-contraseña');

      if (!entrega) {
        return res.status(404).json({ success: false, message: 'No hay check-out para esta reserva' });
      }

      res.status(200).json({ success: true, data: entrega });
    } catch (error) {
      console.error('Error en getCheckout:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  },

  // POST /api/reservas/:id/checkin
  async checkin(req, res) {
    try {
      const { id } = req.params;

      const reserva = await Reserva.findOne({ idReserva: id })
        .populate('auto')
        .populate('usuario', '-contraseña');

      if (!reserva) {
        return res.status(404).json({ success: false, message: 'Reserva no encontrada' });
      }

      if (reserva.estado !== 'Alquilado') {
        return res.status(400).json({
          success: false,
          message: `Solo se puede hacer check-in de reservas en estado Alquilado. Estado actual: ${reserva.estado}`
        });
      }

      const entrega = await Entrega.findOne({ reserva: reserva._id });
      if (!entrega) {
        return res.status(404).json({ success: false, message: 'No se encontró el check-out asociado' });
      }

      const existente = await Devolucion.findOne({ reserva: reserva._id });
      if (existente) {
        return res.status(400).json({ success: false, message: 'Esta reserva ya tiene un check-in registrado' });
      }

      const {
        kmRetorno,
        nivelGasolina,
        porcentajeGasolina,
        inventario,
        dañosNuevos,
        estadoGeneral,
        observaciones,
        estadoFinalVehiculo
      } = req.body;

      if (kmRetorno === undefined || kmRetorno === null) {
        return res.status(400).json({ success: false, message: 'El kilometraje de retorno es requerido' });
      }

      if (kmRetorno < entrega.kmSalida) {
        return res.status(400).json({
          success: false,
          message: `El kilometraje de retorno (${kmRetorno}) no puede ser menor al de salida (${entrega.kmSalida})`
        });
      }

      const devolucionData = {
        fechaDevolucion: new Date(),
        porcentajeGasolina: porcentajeGasolina ?? 100,
        inventario,
        dañosNuevos: dañosNuevos || []
      };

      const cargosAdicionales = calcularCargosAdicionales(entrega, devolucionData, reserva);
      const totalCargosAdicionales = cargosAdicionales.reduce((s, c) => s + c.monto, 0);
      const estadoFinal = estadoFinalVehiculo || 'disponible';

      const devolucion = new Devolucion({
        idDevolucion: await nextId(Devolucion, 'idDevolucion'),
        reserva: reserva._id,
        entrega: entrega._id,
        auto: reserva.auto._id,
        fechaDevolucion: devolucionData.fechaDevolucion,
        kmRetorno,
        nivelGasolina: nivelGasolina || 'Lleno',
        porcentajeGasolina: devolucionData.porcentajeGasolina,
        inventario: inventario || [],
        dañosNuevos: devolucionData.dañosNuevos,
        estadoGeneral: estadoGeneral || 'Bueno',
        observaciones: observaciones || '',
        realizadoPor: req.user?.id,
        cargosAdicionales,
        totalCargosAdicionales,
        estadoFinalVehiculo: estadoFinal
      });

      await devolucion.save();

      // Transition states
      reserva.estado = 'Completada';
      await reserva.save();

      const auto = reserva.auto;
      await Auto.updateOne(
        { _id: auto._id },
        estadoFinal === 'mantenimiento'
          ? { disponible: false, estadoVehiculo: 'mantenimiento' }
          : { disponible: true, estadoVehiculo: 'disponible' }
      );

      // Sync checklist to reflect return state
      try {
        let checklist = await Checklist.findOne({ autoId: auto._id });
        if (checklist) {
          checklist.nivelGasolina = nivelGasolina || checklist.nivelGasolina;
          checklist.porcentajeGasolina = devolucionData.porcentajeGasolina;
          if (estadoGeneral) checklist.estadoGeneral = estadoGeneral;
          if (dañosNuevos?.length) {
            checklist.rayones.push(...dañosNuevos.map(d => ({
              descripcion: d.descripcion,
              ubicacion: d.ubicacion
            })));
          }
          if (observaciones) checklist.observaciones = observaciones;
          await checklist.save();
        }
      } catch (e) {
        console.warn('No se pudo sincronizar el checklist en checkin:', e.message);
      }

      res.status(201).json({
        success: true,
        message: estadoFinal === 'mantenimiento'
          ? 'Check-in registrado. El vehículo pasa a mantenimiento.'
          : 'Check-in registrado. El vehículo está disponible.',
        data: {
          devolucion,
          cargosAdicionales,
          totalCargosAdicionales,
          kmRecorridos: kmRetorno - entrega.kmSalida,
          estadoFinalVehiculo: estadoFinal
        }
      });
    } catch (error) {
      console.error('Error en checkin:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
    }
  },

  // GET /api/reservas/:id/checkin
  async getCheckin(req, res) {
    try {
      const { id } = req.params;

      const reserva = await Reserva.findOne({ idReserva: id });
      if (!reserva) {
        return res.status(404).json({ success: false, message: 'Reserva no encontrada' });
      }

      const devolucion = await Devolucion.findOne({ reserva: reserva._id })
        .populate('auto')
        .populate('entrega')
        .populate('realizadoPor', '-contraseña');

      if (!devolucion) {
        return res.status(404).json({ success: false, message: 'No hay check-in para esta reserva' });
      }

      res.status(200).json({ success: true, data: devolucion });
    } catch (error) {
      console.error('Error en getCheckin:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  },

  // POST /api/reservas/:id/incidencias
  async reportarIncidencia(req, res) {
    try {
      const { id } = req.params;

      const reserva = await Reserva.findOne({ idReserva: id }).populate('auto');
      if (!reserva) {
        return res.status(404).json({ success: false, message: 'Reserva no encontrada' });
      }

      if (reserva.estado !== 'Alquilado') {
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden reportar incidencias en reservas activas (Alquilado)'
        });
      }

      const { tipo, descripcion, costoEstimado, observaciones } = req.body;

      if (!tipo || !descripcion) {
        return res.status(400).json({ success: false, message: 'Tipo y descripción son requeridos' });
      }

      const incidencia = new Incidencia({
        idIncidencia: await nextId(Incidencia, 'idIncidencia'),
        reserva: reserva._id,
        auto: reserva.auto._id,
        tipo,
        descripcion,
        fecha: new Date(),
        reportadoPor: req.user?.id,
        costoEstimado: costoEstimado || 0,
        observaciones: observaciones || ''
      });

      await incidencia.save();

      res.status(201).json({ success: true, message: 'Incidencia registrada', data: incidencia });
    } catch (error) {
      console.error('Error en reportarIncidencia:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  },

  // GET /api/reservas/:id/incidencias
  async getIncidencias(req, res) {
    try {
      const { id } = req.params;

      const reserva = await Reserva.findOne({ idReserva: id });
      if (!reserva) {
        return res.status(404).json({ success: false, message: 'Reserva no encontrada' });
      }

      const incidencias = await Incidencia.find({ reserva: reserva._id })
        .populate('reportadoPor', '-contraseña')
        .sort({ fecha: -1 });

      res.status(200).json({ success: true, data: incidencias });
    } catch (error) {
      console.error('Error en getIncidencias:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  },

  // GET /api/alquileres - all currently rented vehicles
  async getAlquiladosActivos(req, res) {
    try {
      const reservas = await Reserva.find({ estado: 'Alquilado' })
        .populate('auto')
        .populate('usuario', '-contraseña')
        .sort({ fechaFin: 1 });

      const alquileres = await Promise.all(reservas.map(async (reserva) => {
        const entrega = await Entrega.findOne({ reserva: reserva._id });
        const incidencias = await Incidencia.find({ reserva: reserva._id, estado: { $ne: 'Resuelto' } });
        return {
          reserva: reserva.mostrarDetalleReserva(),
          entrega,
          incidenciasPendientes: incidencias.length
        };
      }));

      res.status(200).json({ success: true, data: alquileres });
    } catch (error) {
      console.error('Error en getAlquiladosActivos:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  },

  // GET /api/alquileres/pendientes-checkout - confirmed reservations waiting for checkout
  async getPendientesCheckout(req, res) {
    try {
      const reservas = await Reserva.find({ estado: 'Confirmada' })
        .populate('auto')
        .populate('usuario', '-contraseña')
        .sort({ fechaInicio: 1 });

      res.status(200).json({
        success: true,
        data: reservas.map(r => r.mostrarDetalleReserva())
      });
    } catch (error) {
      console.error('Error en getPendientesCheckout:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  }
};

module.exports = entregaController;
