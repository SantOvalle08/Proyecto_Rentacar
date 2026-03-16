/**
 * Script para verificar datos en MongoDB Atlas
 */

const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Usuario = require('./src/models/usuario');
const Auto = require('./src/models/Auto');
const Reserva = require('./src/models/Reserva');

dotenv.config({
  path: path.join(__dirname, '.env'),
  override: true
});

const ATLAS_URI = process.env.MONGODB_URI;

if (!ATLAS_URI) {
  console.error('Falta MONGODB_URI en el archivo .env');
  process.exit(1);
}

async function verificarDatos() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║      VERIFICACIÓN DE DATOS EN ATLAS            ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  try {
    // Conectar a MongoDB Atlas
    console.log('📡 Conectando a MongoDB Atlas...');
    await mongoose.connect(ATLAS_URI);
    console.log('✅ Conectado a MongoDB Atlas\n');

    // Verificar Usuarios
    console.log('👥 USUARIOS:');
    console.log('═'.repeat(50));
    const usuarios = await Usuario.find({}, { contraseña: 0 }).lean();
    console.log(`Total: ${usuarios.length} usuarios`);
    usuarios.forEach(usuario => {
      console.log(`  • ${usuario.nombre} (${usuario.email}) - Rol: ${usuario.rol}`);
    });

    // Verificar Autos
    console.log('\n🚗 AUTOS:');
    console.log('═'.repeat(50));
    const autos = await Auto.find({}).lean();
    console.log(`Total: ${autos.length} autos`);
    autos.forEach(auto => {
      console.log(`  • ${auto.marca} ${auto.modelo} (${auto.año}) - ${auto.tipoCoche}`);
      console.log(`    Precio: $${auto.precioDia}/día | Disponible: ${auto.disponible ? 'Sí' : 'No'}`);
    });

    // Verificar Reservas
    console.log('\n📋 RESERVAS:');
    console.log('═'.repeat(50));
    const reservas = await Reserva.find({})
      .populate('usuario', 'nombre email')
      .populate('auto', 'marca modelo')
      .lean();
    console.log(`Total: ${reservas.length} reservas`);
    reservas.forEach(reserva => {
      console.log(`  • Reserva #${reserva.idReserva}`);
      console.log(`    Usuario: ${reserva.usuario?.nombre || 'N/A'}`);
      console.log(`    Auto: ${reserva.auto?.marca || 'N/A'} ${reserva.auto?.modelo || 'N/A'}`);
      console.log(`    Estado: ${reserva.estado} | Total: $${reserva.precioTotal}`);
    });

    console.log('\n═'.repeat(50));
    console.log('✅ Verificación completada exitosamente\n');

  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada\n');
  }
}

verificarDatos();
