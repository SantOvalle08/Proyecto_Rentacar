/**
 * Script para cargar datos de JSON a MongoDB Atlas
 * Carga: Autos y Reservas desde archivos JSON
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const Auto = require('./src/models/Auto');
const Reserva = require('./src/models/Reserva');

dotenv.config({
  path: path.join(__dirname, '.env'),
  override: true
});

// URI de MongoDB Atlas (desde el archivo .env)
const ATLAS_URI = process.env.MONGODB_URI;

if (!ATLAS_URI) {
  console.error('Falta MONGODB_URI en el archivo .env');
  process.exit(1);
}

// Rutas a los archivos JSON
const AUTOS_JSON_PATH = path.join(__dirname, '../front/files/public/data/autos.json');
const RESERVAS_JSON_PATH = path.join(__dirname, '../front/files/public/data/reservas.json');

async function cargarAutos() {
  try {
    console.log('\n📦 CARGANDO AUTOS...');
    console.log('═'.repeat(50));

    // Leer archivo JSON de autos
    if (!fs.existsSync(AUTOS_JSON_PATH)) {
      console.log('⚠️  No se encontró el archivo de autos');
      return { success: false, cargados: 0 };
    }

    const autosData = JSON.parse(fs.readFileSync(AUTOS_JSON_PATH, 'utf-8'));
    console.log(`📊 Encontrados ${autosData.length} autos en el archivo JSON`);

    // Verificar autos existentes
    const autosExistentes = await Auto.countDocuments();
    if (autosExistentes > 0) {
      console.log(`⚠️  Hay ${autosExistentes} autos en Atlas. Limpiando...`);
      await Auto.deleteMany({});
      console.log('🗑️  Autos eliminados');
    }

    // Adaptar datos al esquema de MongoDB
    const autosParaDB = autosData.map(auto => ({
      idAuto: auto.id,
      marca: auto.marca,
      modelo: auto.modelo,
      año: auto.año || auto.anio,
      anio: auto.año || auto.anio,
      tipoCoche: auto.tipo || auto.tipoCoche || 'Sedan', // Campo requerido
      tipo: auto.tipo || auto.tipoCoche || 'Sedan',
      color: auto.color || 'No especificado',
      matricula: auto.matricula || 'No especificado',
      disponible: auto.disponible !== false,
      precioDia: auto.precioDia || auto.precioBase,
      precioBase: auto.precioDia || auto.precioBase,
      imagen: auto.imagen || 'default-car.jpg'
    }));

    // Insertar autos en Atlas
    const autosInsertados = await Auto.insertMany(autosParaDB);
    console.log(`✅ ${autosInsertados.length} autos cargados exitosamente`);

    return { success: true, cargados: autosInsertados.length };

  } catch (error) {
    console.error('❌ Error al cargar autos:', error.message);
    return { success: false, error: error.message };
  }
}

async function cargarReservas() {
  try {
    console.log('\n📦 CARGANDO RESERVAS...');
    console.log('═'.repeat(50));

    // Leer archivo JSON de reservas
    if (!fs.existsSync(RESERVAS_JSON_PATH)) {
      console.log('⚠️  No se encontró el archivo de reservas');
      return { success: false, cargados: 0 };
    }

    const reservasData = JSON.parse(fs.readFileSync(RESERVAS_JSON_PATH, 'utf-8'));
    console.log(`📊 Encontradas ${reservasData.length} reservas en el archivo JSON`);

    // Verificar reservas existentes
    const reservasExistentes = await Reserva.countDocuments();
    if (reservasExistentes > 0) {
      console.log(`⚠️  Hay ${reservasExistentes} reservas en Atlas. Limpiando...`);
      await Reserva.deleteMany({});
      console.log('🗑️  Reservas eliminadas');
    }

    const Usuario = require('./src/models/usuario');
    
    // Convertir estado a formato correcto (primera letra mayúscula)
    const normalizarEstado = (estado) => {
      if (!estado) return 'Pendiente';
      const estadosValidos = {
        'pendiente': 'Pendiente',
        'confirmada': 'Confirmada',
        'cancelada': 'Cancelada',
        'completada': 'Completada'
      };
      return estadosValidos[estado.toLowerCase()] || 'Pendiente';
    };

    // Adaptar datos al esquema de MongoDB
    const reservasParaDB = [];
    
    for (const reserva of reservasData) {
      // Buscar el auto por idAuto
      const auto = await Auto.findOne({ idAuto: reserva.autoId });
      if (!auto) {
        console.log(`⚠️  Auto con ID ${reserva.autoId} no encontrado, saltando reserva`);
        continue;
      }

      // Buscar el usuario por idUser
      const usuario = await Usuario.findOne({ idUser: reserva.usuarioId });
      if (!usuario) {
        console.log(`⚠️  Usuario con ID ${reserva.usuarioId} no encontrado, saltando reserva`);
        continue;
      }

      // Generar un idReserva numérico simple si el original no es numérico
      let idReserva = parseInt(reserva.id);
      if (isNaN(idReserva)) {
        // Si no es un número, usar el timestamp
        idReserva = Date.now() + reservasParaDB.length;
      }

      reservasParaDB.push({
        idReserva: idReserva,
        auto: auto._id,
        usuario: usuario._id,
        fechaInicio: new Date(reserva.fechaInicio),
        fechaFin: new Date(reserva.fechaFin),
        precioTotal: reserva.precioTotal,
        estado: normalizarEstado(reserva.estado)
      });
    }

    if (reservasParaDB.length === 0) {
      console.log('⚠️  No se pudieron procesar reservas (falta usuarios o autos)');
      return { success: true, cargados: 0 };
    }

    // Insertar reservas en Atlas
    const reservasInsertadas = await Reserva.insertMany(reservasParaDB);
    console.log(`✅ ${reservasInsertadas.length} reservas cargadas exitosamente`);

    return { success: true, cargados: reservasInsertadas.length };

  } catch (error) {
    console.error('❌ Error al cargar reservas:', error.message);
    return { success: false, error: error.message, cargados: 0 };
  }
}

async function ejecutarCarga() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║    CARGA DE DATOS JSON → MONGODB ATLAS         ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log('\n');

  try {
    // Conectar a MongoDB Atlas
    console.log('📡 Conectando a MongoDB Atlas...');
    await mongoose.connect(ATLAS_URI);
    console.log('✅ Conectado a MongoDB Atlas\n');

    // Cargar datos
    const resultadoAutos = await cargarAutos();
    const resultadoReservas = await cargarReservas();

    // Mostrar resumen
    console.log('\n\n');
    console.log('╔════════════════════════════════════════════════╗');
    console.log('║              RESUMEN DE CARGA                  ║');
    console.log('╚════════════════════════════════════════════════╝');
    console.log('');
    console.log('Tipo               | Cargados | Estado');
    console.log('-------------------|----------|------------------');
    console.log(`Autos              |        ${resultadoAutos.cargados || 0} | ${resultadoAutos.success ? '✓ Éxito' : '✗ Error'}`);
    console.log(`Reservas           |        ${resultadoReservas.cargados || 0} | ${resultadoReservas.success ? '✓ Éxito' : '✗ Error'}`);
    console.log('');
    console.log('═'.repeat(50));

    const totalCargados = (resultadoAutos.cargados || 0) + (resultadoReservas.cargados || 0);
    console.log(`\n🎉 CARGA COMPLETADA`);
    console.log(`📊 Total de registros cargados: ${totalCargados}`);
    console.log('');
    console.log('✅ Los datos están ahora en MongoDB Atlas');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error durante la carga:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada');
    process.exit(0);
  }
}

// Ejecutar carga
ejecutarCarga();
