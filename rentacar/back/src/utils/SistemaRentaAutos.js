/**
 * @module utils/SistemaRentaAutos
 * @description Clase Singleton para gestionar el sistema de renta de autos
 */

const Usuario = require('../models/usuario');
const Catalogo = require('../models/Catalogo');
const Auto = require('../models/Auto');
const Reserva = require('../models/Reserva');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

/**
 * @typedef {Object} UserData
 * @property {string} nombre - Nombre del usuario
 * @property {string} email - Correo electrónico del usuario
 * @property {string} [telefono] - Teléfono del usuario
 * @property {string} contraseña - Contraseña del usuario
 * @property {Object} [metadata] - Metadatos adicionales del usuario
 * @property {string} [metadata.tipoDocumento] - Tipo de documento de identidad
 * @property {string} [metadata.numeroDocumento] - Número de documento de identidad
 */

/**
 * @typedef {Object} ReservaData
 * @property {string} fechaInicio - Fecha de inicio de la reserva
 * @property {string} fechaFin - Fecha de fin de la reserva
 * @property {string} usuario - ID del usuario
 * @property {string} auto - ID del vehículo
 * @property {number} precioTotal - Precio total de la reserva
 * @property {string} [estado] - Estado de la reserva
 * @property {string} [metodoPago] - Método de pago
 * @property {Object} [datosPago] - Datos del pago
 */

/**
 * @typedef {Object} AutoData
 * @property {string} marca - Marca del vehículo
 * @property {string} modelo - Modelo del vehículo
 * @property {number} año - Año del vehículo
 * @property {string} matricula - Matrícula del vehículo
 * @property {string} tipoCoche - Tipo de vehículo
 * @property {number} precioDia - Precio por día
 * @property {string} [imagen] - URL de la imagen
 * @property {string} [descripcion] - Descripción del vehículo
 * @property {Array<string>} [caracteristicas] - Características del vehículo
 * @property {number} [kilometraje] - Kilometraje del vehículo
 * @property {string} combustible - Tipo de combustible
 * @property {string} transmision - Tipo de transmisión
 * @property {number} capacidad - Capacidad de pasajeros
 */

/**
 * Clase Singleton para gestionar el sistema de renta de autos
 * @class
 */
class SistemaRentaAutos {
  /**
   * Constructor de la clase SistemaRentaAutos
   * @constructor
   */
  constructor() {
    if (SistemaRentaAutos.instance) {
      return SistemaRentaAutos.instance;
    }
    
    this.catalogo = null;
    this.dbConnected = false;
    this.catalogoInicializado = false;
    
    // No iniciamos el catálogo aquí porque es una operación asíncrona
    // en su lugar, lo inicializaremos bajo demanda cuando sea necesario
    
    SistemaRentaAutos.instance = this;
  }

  /**
   * Inicializa el catálogo de vehículos
   * @async
   * @returns {Promise<Object>} Catálogo inicializado
   * @throws {Error} Si no hay conexión a MongoDB
   */
  async initCatalogo() {
    try {
      // Si ya está inicializado, no lo hacemos de nuevo
      if (this.catalogoInicializado && this.catalogo) {
        return this.catalogo;
      }
      
      console.log('Inicializando catálogo...');
      
      // Comprobar el estado de la conexión a MongoDB
      const connectionState = mongoose.connection.readyState;
      this.dbConnected = connectionState === 1;
      
      console.log(`Estado de conexión a MongoDB (${connectionState}): ${this.dbConnected ? 'Conectado' : 'Desconectado'}`);
      
      // Si no hay conexión pero MongoDB está conectando (estado 2), esperamos un poco
      if (connectionState === 2) {
        console.log('MongoDB está en proceso de conexión. Esperando...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        // Verificamos de nuevo
        this.dbConnected = mongoose.connection.readyState === 1;
        console.log(`Estado actualizado de conexión a MongoDB: ${this.dbConnected ? 'Conectado' : 'Desconectado'}`);
      }
      
      if (this.dbConnected) {
        try {
          // Intentar encontrar un catálogo existente
          const existingCatalogo = await Catalogo.findOne();
          
          if (existingCatalogo) {
            console.log('Catálogo encontrado en la base de datos:', existingCatalogo._id);
            this.catalogo = existingCatalogo;
          } else {
            console.log('No se encontró un catálogo existente. Creando uno nuevo...');
            
            // Primero, verificamos si hay autos en la colección
            const autosExistentes = await Auto.find({});
            console.log(`Se encontraron ${autosExistentes.length} autos existentes en la base de datos.`);
            
            // Crear un nuevo catálogo con referencias a los autos existentes
            this.catalogo = new Catalogo({
              listaAutos: autosExistentes.map(auto => auto._id)
            });
            
            await this.catalogo.save();
            console.log(`Nuevo catálogo creado con ${autosExistentes.length} autos:`, this.catalogo._id);
          }
          
          this.catalogoInicializado = true;
          return this.catalogo;
        } catch (dbError) {
          console.error('Error al acceder a la base de datos:', dbError);
          // Continuar con catálogo en memoria si hay error al acceder a la DB
          throw dbError;
        }
      } else {
        throw new Error('No hay conexión a MongoDB.');
      }
    } catch (error) {
      console.error('Error al inicializar el catálogo:', error);
      
      // Si falló la inicialización, creamos un catálogo en memoria como fallback
      console.warn('Usando catálogo en memoria como fallback.');
      this.catalogo = { 
        listaAutos: [],
        mostrarCatalogo: async function() {
          console.log('Usando catálogo en memoria debido a error de inicialización');
          return [];
        },
        save: async function() {
          console.log('Operación save simulada en catálogo en memoria');
          return this;
        }
      };
      
      this.dbConnected = false;
      this.catalogoInicializado = true;
      return this.catalogo;
    }
  }

  /**
   * Registra un nuevo usuario en el sistema
   * @async
   * @param {UserData} userData - Datos del usuario a registrar
   * @returns {Promise<boolean>} Estado de éxito de la operación
   */
  async registrarUsuario(userData) {
    try {
      console.log('Registrando usuario con datos:', userData);
      
      // Check if MongoDB is connected before proceeding
      this.dbConnected = mongoose.connection.readyState === 1;
      
      if (!this.dbConnected) {
        console.warn('No hay conexión a MongoDB. No se puede registrar el usuario.');
        return false;
      }
      
      // Generate new user ID
      const lastUser = await Usuario.findOne().sort({ idUser: -1 });
      const idUser = lastUser ? lastUser.idUser + 1 : 1;
      
      // Extract metadata if provided
      const { metadata, ...userDataWithoutMetadata } = userData;
      
      // Create user data object with all fields
      const userDataToSave = {
        ...userDataWithoutMetadata,
        idUser
      };
      
      // Add type specific fields from metadata if provided
      if (metadata) {
        if (metadata.tipoDocumento) userDataToSave.tipoDocumento = metadata.tipoDocumento;
        if (metadata.numeroDocumento) userDataToSave.numeroDocumento = metadata.numeroDocumento;
      }
      
      console.log('Datos finales del usuario a guardar:', userDataToSave);
      
      const usuario = new Usuario(userDataToSave);
      
      await usuario.save();
      console.log(`Usuario registrado con éxito. ID: ${usuario._id}, idUser: ${usuario.idUser}`);
      return true;
    } catch (error) {
      console.error('Error al registrar usuario:', error);
      return false;
    }
  }

  /**
   * Autentica un usuario existente
   * @async
   * @param {string} email - Correo electrónico del usuario
   * @param {string} contraseña - Contraseña del usuario
   * @returns {Promise<Object|null>} Datos del usuario y token si la autenticación es exitosa
   */
  async autenticarUsuario(email, contraseña) {
    try {
      console.log('============================================');
      console.log('INTENTO DE AUTENTICACIÓN');
      console.log('Email:', email);
      console.log('============================================');
      
      // Check if MongoDB is connected before proceeding
      this.dbConnected = mongoose.connection.readyState === 1;
      
      if (!this.dbConnected) {
        console.error('Error: No hay conexión a MongoDB');
        throw new Error('No hay conexión a la base de datos');
      }
      
      // Buscar usuario por email
      const usuario = await Usuario.findOne({ email: email.toLowerCase() });
      if (!usuario) {
        console.log(`Usuario con email ${email} no encontrado`);
        return null;
      }
      
      console.log('Usuario encontrado:', {
        id: usuario._id,
        email: usuario.email,
        nombre: usuario.nombre
      });
      
      // Validar contraseña
      try {
        const esValido = await usuario.compararContraseña(contraseña);
        if (!esValido) {
          console.log(`Contraseña inválida para usuario ${email}`);
          return null;
        }
      } catch (passwordError) {
        console.error('Error al validar contraseña:', passwordError);
        return null;
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { 
          id: usuario._id, 
          email: usuario.email,
          rol: usuario.rol || 'cliente'
        },
        process.env.JWT_SECRET || 'secretkey',
        { expiresIn: '24h' }
      );
      
      console.log(`Usuario ${email} autenticado con éxito`);
      
      return {
        usuario: {
          id: usuario._id,
          idUser: usuario.idUser,
          nombre: usuario.nombre,
          email: usuario.email,
          telefono: usuario.telefono,
          rol: usuario.rol || 'cliente'
        },
        token
      };
    } catch (error) {
      console.error('Error en autenticación:', error);
      throw error;
    }
  }

  /**
   * Muestra el catálogo de vehículos disponibles
   * @async
   * @returns {Promise<Array>} Lista de vehículos disponibles
   */
  async verCatalogo() {
    try {
      console.log('=== INICIO DE PROCESO: CONSULTAR CATÁLOGO ===');
      
      // Asegurarse de que el catálogo esté inicializado
      if (!this.catalogoInicializado || !this.catalogo) {
        console.log('Catálogo no inicializado. Inicializando...');
        await this.initCatalogo();
      }
      
      // Verificar la conexión a MongoDB
      const connectionState = mongoose.connection.readyState;
      this.dbConnected = connectionState === 1;
      
      console.log(`Estado de conexión a MongoDB (${connectionState}): ${this.dbConnected ? 'Conectado' : 'Desconectado'}`);
      
      // ESTRATEGIA 1: Intentar obtener autos a través del catálogo
      if (this.dbConnected && typeof this.catalogo.mostrarCatalogo === 'function') {
        try {
          console.log('Obteniendo autos a través del catálogo (Estrategia 1)');
          const catalogoAutos = await this.catalogo.mostrarCatalogo();
          
          if (catalogoAutos && Array.isArray(catalogoAutos) && catalogoAutos.length > 0) {
            console.log(`Éxito: Se encontraron ${catalogoAutos.length} autos en el catálogo`);
            console.log('=== FIN DE PROCESO: CONSULTAR CATÁLOGO ===');
            return catalogoAutos;
          } else {
            console.log('El catálogo está vacío o no devolvió resultados válidos');
          }
        } catch (catalogError) {
          console.error('Error al obtener autos a través del catálogo:', catalogError);
        }
      }
      
      // ESTRATEGIA 2: Obtener autos directamente de la colección Auto
      if (this.dbConnected) {
        try {
          console.log('Obteniendo autos directamente de la colección Auto (Estrategia 2)');
          const autos = await Auto.find({}).lean();
          
          console.log(`Se encontraron ${autos.length} autos directamente en la colección Auto`);
          
          // Si encontramos autos pero el catálogo está vacío, actualizar el catálogo
          if (autos.length > 0 && 
              this.catalogo && 
              Array.isArray(this.catalogo.listaAutos) && 
              this.catalogo.listaAutos.length === 0 &&
              typeof this.catalogo.save === 'function') {
            
            console.log('Actualizando el catálogo con los autos encontrados...');
            this.catalogo.listaAutos = autos.map(auto => auto._id);
            
            try {
              await this.catalogo.save();
              console.log('Catálogo actualizado con éxito');
            } catch (updateError) {
              console.error('Error al actualizar el catálogo:', updateError);
            }
          }
          
          // Convertir los documentos en el formato esperado
          const autosFormateados = autos.map(auto => {
            // Verificar y arreglar la URL de la imagen
            let imagenUrl = auto.imagen || 'https://via.placeholder.com/300x200?text=Auto+No+Disponible';
            
            // Si la imagen no comienza con http y no es una ruta local, agregar prefijo para placeholder
            if (!imagenUrl.startsWith('http') && !imagenUrl.startsWith('/')) {
              imagenUrl = 'https://via.placeholder.com/300x200?text=' + encodeURIComponent(auto.marca + ' ' + auto.modelo);
            }
            
            return {
              id: auto.idAuto,
              marca: auto.marca,
              modelo: auto.modelo,
              año: auto.año,
              anio: auto.año || auto.anio,
              tipo: auto.tipoCoche || auto.tipo,
              tipoCoche: auto.tipoCoche || auto.tipo,
              color: auto.color || 'No especificado',
              matricula: auto.matricula || 'No especificado',
              disponible: auto.disponible !== undefined ? auto.disponible : true,
              precioDia: auto.precioDia || auto.precioBase || 0,
              precioBase: auto.precioDia || auto.precioBase || 0,
              imagen: imagenUrl
            };
          });
          
          console.log(`Éxito: Devolviendo ${autosFormateados.length} autos formateados`);
          console.log('=== FIN DE PROCESO: CONSULTAR CATÁLOGO ===');
          return autosFormateados;
        } catch (autoQueryError) {
          console.error('Error al consultar autos directamente:', autoQueryError);
        }
      }
      
      // ESTRATEGIA 3: Verificar el catálogo en memoria como último recurso
      if (this.catalogo && Array.isArray(this.catalogo.listaAutos) && this.catalogo.listaAutos.length > 0) {
        console.log(`Usando catálogo en memoria como último recurso: ${this.catalogo.listaAutos.length} autos`);
        console.log('=== FIN DE PROCESO: CONSULTAR CATÁLOGO ===');
        return this.catalogo.listaAutos;
      }
      
      // Si todo falla, devolver array vacío
      console.log('No se pudieron obtener autos. Devolviendo array vacío.');
      console.log('=== FIN DE PROCESO: CONSULTAR CATÁLOGO ===');
      return [];
      
    } catch (error) {
      console.error('Error general al consultar catálogo:', error);
      
      // Último intento desesperado: consulta directa a MongoDB
      try {
        if (mongoose.connection.readyState === 1) {
          console.log('ÚLTIMO INTENTO: Consultando autos directamente como fallback final');
          const autos = await Auto.find({}).lean();
          
          console.log(`Se encontraron ${autos.length} autos en el último intento`);
          
          if (autos.length > 0) {
            return autos.map(auto => {
              // Verificar y arreglar la URL de la imagen
              let imagenUrl = auto.imagen || 'https://via.placeholder.com/300x200?text=Auto+No+Disponible';
              
              // Si la imagen no comienza con http y no es una ruta local, agregar prefijo para placeholder
              if (!imagenUrl.startsWith('http') && !imagenUrl.startsWith('/')) {
                imagenUrl = 'https://via.placeholder.com/300x200?text=' + encodeURIComponent(auto.marca + ' ' + auto.modelo);
              }
              
              return {
                id: auto.idAuto,
                marca: auto.marca,
                modelo: auto.modelo,
                año: auto.año,
                anio: auto.año || auto.anio,
                tipo: auto.tipoCoche || auto.tipo,
                tipoCoche: auto.tipoCoche || auto.tipo,
                color: auto.color || 'No especificado',
                matricula: auto.matricula || 'No especificado',
                disponible: auto.disponible !== undefined ? auto.disponible : true,
                precioDia: auto.precioDia || auto.precioBase || 0,
                precioBase: auto.precioDia || auto.precioBase || 0,
                imagen: imagenUrl
              };
            });
          }
        }
      } catch (finalError) {
        console.error('Error en el último intento de consulta:', finalError);
      }
      
      console.log('=== FIN DE PROCESO CON ERROR: CONSULTAR CATÁLOGO ===');
      return [];
    }
  }

  /**
   * Realiza una nueva reserva
   * @async
   * @param {ReservaData} reservaData - Datos de la reserva
   * @returns {Promise<Object|null>} Datos de la reserva creada
   */
  async realizarReserva(reservaData) {
    try {
      console.log('Creando reserva con datos:', reservaData);
      
      // Check if MongoDB is connected
      if (mongoose.connection.readyState !== 1) {
        console.error('Error: No hay conexión a MongoDB');
        throw new Error('No hay conexión a la base de datos');
      }
      
      // Validate required fields
      const requiredFields = ['fechaInicio', 'fechaFin', 'usuario', 'auto', 'precioTotal'];
      const missingFields = requiredFields.filter(field => !reservaData[field]);
      
      if (missingFields.length > 0) {
        console.error('Campos requeridos faltantes:', missingFields);
        throw new Error(`Campos requeridos faltantes: ${missingFields.join(', ')}`);
      }
      
      // Generate new reservation ID
      const lastReserva = await Reserva.findOne().sort({ idReserva: -1 });
      const idReserva = lastReserva ? lastReserva.idReserva + 1 : 1;
      
      // Create new reservation
      const reserva = new Reserva({
        ...reservaData,
        idReserva,
        estado: reservaData.estado || 'Pendiente'
      });
      
      // Set auto as unavailable during the reservation period
      const auto = await Auto.findById(reservaData.auto);
      if (!auto) {
        throw new Error('Auto no encontrado');
      }
      
      if (!auto.disponible) {
        throw new Error('Auto no disponible');
      }
      
      // Start a session for transaction
      const session = await mongoose.startSession();
      session.startTransaction();
      
      try {
        // Save reservation
        await reserva.save({ session });
        
        // Update auto availability
        auto.disponible = false;
        await auto.save({ session });
        
        // Commit transaction
        await session.commitTransaction();
        
        console.log(`Reserva creada con éxito. ID: ${reserva._id}, idReserva: ${reserva.idReserva}`);
        return reserva;
      } catch (error) {
        // If anything fails, abort transaction
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    } catch (error) {
      console.error('Error al realizar reserva:', error);
      throw error; // Re-throw to handle in controller
    }
  }

  /**
   * Agrega un nuevo vehículo al sistema
   * @async
   * @param {AutoData} autoData - Datos del vehículo
   * @returns {Promise<Object|null>} Datos del vehículo agregado
   */
  async agregarAuto(autoData) {
    try {
      console.log('=== INICIO DE PROCESO: AGREGAR AUTO ===');
      console.log('Datos del auto a agregar:', autoData);
      
      // Asegurarse de que el catálogo esté inicializado
      if (!this.catalogoInicializado || !this.catalogo) {
        console.log('Catálogo no inicializado. Inicializando...');
        await this.initCatalogo();
      }
      
      // Verificar la conexión a MongoDB
      const connectionState = mongoose.connection.readyState;
      this.dbConnected = connectionState === 1;
      
      console.log(`Estado actual de conexión a MongoDB (${connectionState}): ${this.dbConnected ? 'Conectado' : 'Desconectado'}`);
      
      if (!this.dbConnected) {
        console.error('No hay conexión a MongoDB. No se puede agregar el auto.');
        return null;
      }
      
      // Determinar si estamos recibiendo una instancia de Auto o datos crudos
      let auto;
      if (autoData instanceof Auto) {
        console.log('Recibida una instancia de Auto directamente.');
        auto = autoData;
      } else {
        console.log('Recibidos datos crudos. Creando instancia de Auto...');
        
        // Generar un nuevo ID de auto si no se proporciona
        if (!autoData.idAuto || typeof autoData.idAuto !== 'number') {
          const lastAuto = await Auto.findOne().sort({ idAuto: -1 });
          autoData.idAuto = lastAuto ? lastAuto.idAuto + 1 : 1;
          console.log(`Generado nuevo ID de auto: ${autoData.idAuto}`);
        }
        
        // Asegurar que todos los campos requeridos estén presentes
        const autoPreparado = {
          ...autoData,
          
          // Asegurar campos de año
          año: autoData.año || autoData.anio || new Date().getFullYear(),
          anio: autoData.año || autoData.anio || new Date().getFullYear(),
          
          // Asegurar campos de tipo
          tipoCoche: autoData.tipoCoche || autoData.tipo || 'Sedan',
          tipo: autoData.tipoCoche || autoData.tipo || 'Sedan',
          
          // Asegurar campos de precio
          precioDia: autoData.precioDia || autoData.precioBase || 0,
          precioBase: autoData.precioDia || autoData.precioBase || 0,
          
          // Valores por defecto para otros campos
          color: autoData.color || 'No especificado',
          matricula: autoData.matricula || 'No especificado',
          disponible: autoData.disponible !== undefined ? autoData.disponible : true,
          imagen: autoData.imagen || 'default-car.jpg'
        };
        
        console.log('Datos de auto preparados para guardar:', autoPreparado);
        auto = new Auto(autoPreparado);
      }
      
      // Guardar el auto en la base de datos
      try {
        await auto.save();
        console.log(`Auto guardado con éxito en MongoDB. ID: ${auto._id}, idAuto: ${auto.idAuto}`);
      } catch (saveError) {
        console.error('Error al guardar el auto en MongoDB:', saveError);
        
        // Si el error es por duplicado de idAuto, intentar con un nuevo ID
        if (saveError.code === 11000 && saveError.keyPattern && saveError.keyPattern.idAuto) {
          console.log('Error de duplicación de idAuto. Intentando con un nuevo ID...');
          
          // Generar un nuevo ID que no exista
          const lastAuto = await Auto.findOne().sort({ idAuto: -1 });
          auto.idAuto = lastAuto ? lastAuto.idAuto + 1 : 1;
          console.log(`Nuevo ID generado: ${auto.idAuto}`);
          
          try {
            await auto.save();
            console.log(`Auto guardado con nuevo ID: ${auto.idAuto}`);
          } catch (retryError) {
            console.error('Falló el segundo intento de guardar:', retryError);
            return null;
          }
        } else {
          // Otro tipo de error, no podemos continuar
          return null;
        }
      }
      
      // Verificar que el catálogo sea una instancia válida de Catalogo
      if (!this.dbConnected || typeof this.catalogo.save !== 'function') {
        console.log('Detectado catálogo inválido. Reinicializando...');
        await this.initCatalogo();
        
        // Si aún no tenemos un catálogo válido, crear uno nuevo
        if (typeof this.catalogo.save !== 'function') {
          console.log('Creando nuevo catálogo real en la base de datos...');
          this.catalogo = new Catalogo({ listaAutos: [auto._id] });
          await this.catalogo.save();
          console.log('Nuevo catálogo creado con el auto agregado.');
          return auto;
        }
      }
      
      // Verificar si el auto ya existe en el catálogo
      const autoIdStr = auto._id.toString();
      const listaIds = this.catalogo.listaAutos.map(id => id.toString());
      
      if (listaIds.includes(autoIdStr)) {
        console.log('Auto ya existente en el catálogo. No es necesario agregarlo de nuevo.');
      } else {
        // Agregar el auto al catálogo
        console.log('Agregando auto al catálogo...');
        this.catalogo.listaAutos.push(auto._id);
        
        try {
          await this.catalogo.save();
          console.log(`Auto agregado al catálogo. Total de autos: ${this.catalogo.listaAutos.length}`);
        } catch (catalogSaveError) {
          console.error('Error al guardar el catálogo:', catalogSaveError);
          // El auto ya está guardado, así que devolvemos el auto aunque el catálogo falle
        }
      }
      
      console.log('=== FIN DE PROCESO: AUTO AGREGADO EXITOSAMENTE ===');
      return auto;
    } catch (error) {
      console.error('Error general al agregar auto:', error);
      return null;
    }
  }
}

// Export singleton instance
module.exports = new SistemaRentaAutos(); 