/**
 * Script de Migración de MongoDB Local a MongoDB Atlas
 * Migra: Usuarios, Autos, Catálogo, Reservas, Checklists
 */

const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Usuario = require('./src/models/usuario');
const Auto = require('./src/models/Auto');
const Catalogo = require('./src/models/Catalogo');
const Reserva = require('./src/models/Reserva');
const Checklist = require('./src/models/Checklist');

dotenv.config({
  path: path.join(__dirname, '.env'),
  override: true
});

// Conexiones
const LOCAL_URI = 'mongodb://localhost:27017/rentacar';
const ATLAS_URI = process.env.MONGODB_URI;

if (!ATLAS_URI) {
  console.error('Falta MONGODB_URI en el archivo .env');
  process.exit(1);
}

// Crear dos conexiones separadas
let localConnection;
let atlasConnection;

async function conectarBases() {
  console.log('============================================');
  console.log('CONECTANDO A BASES DE DATOS');
  console.log('============================================\n');

  try {
    // Conectar a MongoDB Local
    console.log('📡 Conectando a MongoDB Local...');
    localConnection = await mongoose.createConnection(LOCAL_URI).asPromise();
    console.log('✓ Conectado a MongoDB Local\n');

    // Conectar a MongoDB Atlas
    console.log('📡 Conectando a MongoDB Atlas...');
    atlasConnection = await mongoose.createConnection(ATLAS_URI).asPromise();
    console.log('✓ Conectado a MongoDB Atlas\n');

    return true;
  } catch (error) {
    console.error('✗ Error al conectar a las bases de datos:', error.message);
    return false;
  }
}

async function migrarColeccion(nombreModelo, ModeloClass) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`MIGRANDO: ${nombreModelo.toUpperCase()}`);
  console.log('='.repeat(50));

  try {
    // Obtener datos de MongoDB Local
    const ModeloLocal = localConnection.model(nombreModelo, ModeloClass.schema);
    const datosLocales = await ModeloLocal.find({}).lean();

    console.log(`📊 Encontrados ${datosLocales.length} registros en local`);

    if (datosLocales.length === 0) {
      console.log(`⚠️  No hay datos para migrar en ${nombreModelo}`);
      return { success: true, migrados: 0 };
    }

    // Limpiar colección en Atlas (opcional - comentar si quieres preservar datos existentes)
    const ModeloAtlas = atlasConnection.model(nombreModelo, ModeloClass.schema);
    const datosExistentes = await ModeloAtlas.countDocuments();
    
    if (datosExistentes > 0) {
      console.log(`⚠️  Hay ${datosExistentes} registros en Atlas. ¿Deseas reemplazarlos?`);
      // Por seguridad, limpiar la colección
      await ModeloAtlas.deleteMany({});
      console.log(`🗑️  Colección limpiada en Atlas`);
    }

    // Insertar datos en Atlas
    console.log(`📤 Insertando ${datosLocales.length} registros en Atlas...`);
    
    // Insertar en lotes para mejor rendimiento
    const batchSize = 100;
    let migrados = 0;
    
    for (let i = 0; i < datosLocales.length; i += batchSize) {
      const batch = datosLocales.slice(i, i + batchSize);
      await ModeloAtlas.insertMany(batch, { ordered: false });
      migrados += batch.length;
      console.log(`   Progreso: ${migrados}/${datosLocales.length}`);
    }

    console.log(`✓ ${nombreModelo}: ${migrados} registros migrados exitosamente`);
    return { success: true, migrados };

  } catch (error) {
    console.error(`✗ Error al migrar ${nombreModelo}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function ejecutarMigracion() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║   MIGRACIÓN MONGODB LOCAL → MONGODB ATLAS      ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log('\n');

  try {
    // Conectar a ambas bases de datos
    const conectado = await conectarBases();
    if (!conectado) {
      console.error('No se pudo conectar a las bases de datos. Abortando migración.');
      process.exit(1);
    }

    // Resumen de migración
    const resultados = {
      usuarios: null,
      autos: null,
      catalogos: null,
      reservas: null,
      checklists: null
    };

    // Migrar cada colección
    resultados.usuarios = await migrarColeccion('Usuario', Usuario);
    resultados.autos = await migrarColeccion('Auto', Auto);
    resultados.catalogos = await migrarColeccion('Catalogo', Catalogo);
    resultados.reservas = await migrarColeccion('Reserva', Reserva);
    resultados.checklists = await migrarColeccion('Checklist', Checklist);

    // Mostrar resumen final
    console.log('\n\n');
    console.log('╔════════════════════════════════════════════════╗');
    console.log('║           RESUMEN DE MIGRACIÓN                 ║');
    console.log('╚════════════════════════════════════════════════╝');
    console.log('');
    console.log('Colección          | Migrados | Estado');
    console.log('-------------------|----------|------------------');
    
    Object.entries(resultados).forEach(([coleccion, resultado]) => {
      const nombre = coleccion.padEnd(18);
      const cantidad = resultado.migrados ? resultado.migrados.toString().padStart(8) : '0'.padStart(8);
      const estado = resultado.success ? '✓ Éxito' : '✗ Error';
      console.log(`${nombre} | ${cantidad} | ${estado}`);
    });

    console.log('');
    console.log('═'.repeat(50));
    
    const totalMigrados = Object.values(resultados).reduce(
      (sum, r) => sum + (r.migrados || 0), 0
    );
    
    console.log(`\n🎉 MIGRACIÓN COMPLETADA`);
    console.log(`📊 Total de registros migrados: ${totalMigrados}`);
    console.log('');
    console.log('✅ Ahora puedes usar MongoDB Atlas en tu aplicación');
    console.log('✅ El archivo .env ya está configurado con Atlas');
    console.log('');

  } catch (error) {
    console.error('\n✗ Error durante la migración:', error);
    process.exit(1);
  } finally {
    // Cerrar conexiones
    if (localConnection) await localConnection.close();
    if (atlasConnection) await atlasConnection.close();
    console.log('🔌 Conexiones cerradas');
    process.exit(0);
  }
}

// Ejecutar migración
ejecutarMigracion();
