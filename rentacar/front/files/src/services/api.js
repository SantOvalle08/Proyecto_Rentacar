// API Service for RentaCar app

const DEV_API_CANDIDATES = ['http://localhost:5001', 'http://localhost:8080'];

const normalizeBaseUrl = (baseUrl) => {
  if (!baseUrl) return '';
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
};

const getApiBaseCandidates = () => {
  const explicitUrl = process.env.NEXT_PUBLIC_API_URL;
  if (explicitUrl) {
    return [normalizeBaseUrl(explicitUrl)];
  }

  if (process.env.NODE_ENV === 'development') {
    return DEV_API_CANDIDATES.map(normalizeBaseUrl);
  }

  // En despliegue mismo dominio/reverse-proxy.
  return [''];
};

const API_BASE_CANDIDATES = getApiBaseCandidates();
let preferredApiBaseUrl = null;

const getOrderedApiCandidates = () => {
  if (!preferredApiBaseUrl || !API_BASE_CANDIDATES.includes(preferredApiBaseUrl)) {
    return API_BASE_CANDIDATES;
  }

  return [
    preferredApiBaseUrl,
    ...API_BASE_CANDIDATES.filter((candidate) => candidate !== preferredApiBaseUrl)
  ];
};

// Helper function for fetch requests
const fetchWithAuth = async (url, options = {}) => {
  try {
    const requestBody = options.body
      ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body))
      : undefined;

    // Get the token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    // Set default headers
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers
    };

    // Add auth token if it exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let response;
    let lastError;

    for (const baseUrl of getOrderedApiCandidates()) {
      const fullUrl = `${baseUrl}${url}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        response = await fetch(fullUrl, {
          ...options,
          headers,
          mode: 'cors',
          cache: 'no-cache',
          credentials: 'same-origin',
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        preferredApiBaseUrl = baseUrl;
        break;
      } catch (candidateError) {
        clearTimeout(timeoutId);
        lastError = candidateError;

        const isNetworkIssue =
          candidateError?.name === 'AbortError' ||
          (candidateError instanceof TypeError && /fetch|network/i.test(candidateError.message));

        if (!isNetworkIssue) {
          throw candidateError;
        }

        console.warn(`No se pudo conectar a ${fullUrl}:`, candidateError.message);
      }
    }

    if (!response) {
      throw lastError || new Error('No se pudo establecer conexion con la API');
    }

    if (response.status === 204) {
      return { success: true };
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();

      if (!response.ok) {
        console.warn('Error en respuesta del servidor:', data);
        throw new Error(data.message || 'Ocurrio un error en la solicitud');
      }

      return data;
    } else {
      const text = await response.text();

      if (!response.ok) {
        const errorMsg = text || `Error del servidor: ${response.status} ${response.statusText}`;
        console.warn('Error en respuesta del servidor:', response.status, errorMsg.substring(0, 200));
        throw new Error(errorMsg);
      }

      try {
        return JSON.parse(text);
      } catch (e) {
        return { success: true, message: text };
      }
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn('Timeout en la solicitud');
      throw new Error('La solicitud ha excedido el tiempo de espera. Verifique que el servidor esta respondiendo.');
    }

    if (error instanceof TypeError && error.message.includes('NetworkError')) {
      console.warn('Error de red:', error.message);
      throw new Error('Error de conexion con el servidor. Verifique que el servidor esta en ejecucion y accesible.');
    }

    if (error instanceof DOMException && error.name === 'NetworkError') {
      console.warn('Error CORS:', error.message);
      throw new Error('Error de CORS. Verifique la configuracion del servidor.');
    }

    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      console.warn('Error al analizar respuesta JSON:', error.message);
      throw new Error('Error en formato de respuesta del servidor');
    }

    console.warn('Error general en fetch:', error.message);
    throw error;
  }
};

// Helper functions for localStorage persistence
const localStorageKeys = {
  autos: 'rentacar_autos',
  usuarios: 'rentacar_usuarios',
  reservas: 'rentacar_reservas'
};

// Get data from localStorage
const getLocalData = (key) => {
  if (typeof window === 'undefined') return null;

  try {
    const data = localStorage.getItem(localStorageKeys[key]);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.warn(`Error getting ${key} from localStorage:`, error.message);
    return null;
  }
};

// Save data to localStorage
const saveLocalData = (key, data) => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(localStorageKeys[key], JSON.stringify(data));
  } catch (error) {
    console.warn(`Error saving ${key} to localStorage:`, error.message);
  }
};

// Auth endpoints
const auth = {
  register: (userData) => fetchWithAuth('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  }),
  
  login: (credentials) => fetchWithAuth('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  }),
  
  verifyToken: () => fetchWithAuth('/api/auth/verify')
};

// Usuarios endpoints
//
// IMPORTANTE: este módulo NO debe escribir ni leer datos de usuarios desde
// localStorage. La única fuente de verdad es MongoDB a través del backend.
// localStorage sólo se usa para persistir la sesión (token + user actual)
// desde el flujo de login y desde la página de perfil tras una actualización
// confirmada por el servidor. Cualquier "fallback" silencioso a localStorage
// vuelve a introducir los bugs de datos viejos / desactualizados que ya
// resolvimos en el dashboard.
const usuarios = {
  getAll: async () => {
    // Sin fallback: si la API falla, propagamos el error para que la UI
    // pueda mostrar un mensaje real ("Error al conectar con el servidor")
    // en lugar de pintar datos viejos.
    return fetchWithAuth('/api/usuarios');
  },

  getById: async (id) => {
    if (id === undefined || id === null || id === '') {
      throw new Error('ID de usuario requerido');
    }
    return fetchWithAuth(`/api/usuarios/${id}`);
  },

  create: async (usuarioData) => {
    // El backend expone /api/auth/register para alta de usuarios; lo dejamos
    // como único punto de entrada. Si en el futuro se agrega POST /api/usuarios
    // se puede ajustar aquí.
    return fetchWithAuth('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(usuarioData)
    });
  },

  update: async (id, usuarioData) => {
    if (id === undefined || id === null || id === '') {
      throw new Error('ID de usuario requerido para actualizar');
    }
    return fetchWithAuth(`/api/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(usuarioData)
    });
  },

  delete: async (id) => {
    if (id === undefined || id === null || id === '') {
      throw new Error('ID de usuario requerido para eliminar');
    }
    return fetchWithAuth(`/api/usuarios/${id}`, {
      method: 'DELETE'
    });
  },

  /**
   * Re-hidrata el usuario actual desde el backend. Útil tras login o tras
   * cualquier operación que pueda haber dejado el localStorage desfasado.
   * @param {string|number} id - _id de Mongo o idUser numérico.
   */
  getProfile: (id) => {
    if (id === undefined || id === null || id === '') {
      throw new Error('ID de usuario requerido para obtener perfil');
    }
    return fetchWithAuth(`/api/usuarios/${id}`);
  },

  /**
   * Actualiza el perfil del usuario indicado.
   * El endpoint /:id/profile acepta tanto _id de Mongo como idUser numérico
   * (gracias a findUsuarioByIdentifier en el backend). Devuelve siempre el
   * usuario en su shape canónico (toAuthJSON).
   * @param {string|number} id - _id o idUser del usuario.
   * @param {Object} userData - Campos a actualizar (nombre, email, telefono, ...).
   */
  updateProfile: (id, userData) => {
    if (id === undefined || id === null || id === '') {
      throw new Error('ID de usuario requerido para actualizar perfil');
    }
    return fetchWithAuth(`/api/usuarios/${id}/profile`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }
};

// Auto endpoints with localStorage fallback/syncing
const autos = {
  getAll: async () => {
    try {
      console.log('API Service: Obteniendo lista de autos');
      
      // OPTIMIZACIÓN: Obtener desde localStorage PRIMERO para carga rápida
      const localData = getLocalData('autos');
      if (localData && Array.isArray(localData) && localData.length > 0) {
        console.log('Usando datos de vehículos desde localStorage (carga rápida):', localData.length);
        
        // Sincronizar con backend en segundo plano (sin disparar eventos para evitar bucles)
        setTimeout(async () => {
          try {
            const response = await fetchWithAuth('/api/autos');
            if (response.success && Array.isArray(response.data) && response.data.length > 0) {
              saveLocalData('autos', response.data);
            }
          } catch (error) {
            // offline — localStorage sigue siendo válido
          }
        }, 500);

        return { success: true, data: localData, source: 'localStorage' };
      }
      
      // Si no hay datos locales, intentar obtener del backend
      console.log('No hay datos locales, intentando backend...');
      
      // Intentar backend UNA SOLA VEZ (si falla, cargar JSON rápidamente)
      try {
        console.log('Intentando obtener autos desde la API: /api/autos');
        const response = await fetchWithAuth('/api/autos');
        
        if (response.success && Array.isArray(response.data) && response.data.length > 0) {
          console.log(`API retornó ${response.data.length} autos`);
          saveLocalData('autos', response.data);
          return response;
        }
      } catch (error) {
        console.warn('Backend no disponible, usando datos locales:', error.message);
      }
      
      // Backend no disponible - Cargar desde archivo JSON local
      try {
        console.log('Cargando datos desde archivo JSON local');
        const response = await fetch('/data/autos.json');
        
        if (response.ok) {
          const jsonData = await response.json();
          if (Array.isArray(jsonData) && jsonData.length > 0) {
            console.log('Datos cargados desde archivo JSON local:', jsonData.length);
            saveLocalData('autos', jsonData);
            return { success: true, data: jsonData, source: 'json' };
          }
        }
      } catch (error) {
        console.warn('Error loading from local JSON:', error);
      }
      
      // Intento 5: Crear autos de muestra si todo lo demás falla
      console.log('Creando datos de muestra como último recurso');
      const sampleData = [
        {
          id: 1,
          marca: 'Toyota',
          modelo: 'Corolla',
          anio: 2022,
          año: 2022,
          tipo: 'Sedan',
          tipoCoche: 'Sedan',
          color: 'Blanco',
          matricula: 'ABC-123',
          disponible: true,
          precioBase: 50,
          precioDia: 50,
          imagen: 'https://toyotaassets.scene7.com/is/image/toyota/COR_MY23_0001_V001-1?fmt=jpg&fit=crop&qlt=90&wid=1500'
        },
        {
          id: 2,
          marca: 'Honda',
          modelo: 'Civic',
          anio: 2021,
          año: 2021,
          tipo: 'Sedan',
          tipoCoche: 'Sedan',
          color: 'Azul',
          matricula: 'XYZ-789',
          disponible: true,
          precioBase: 45,
          precioDia: 45,
          imagen: 'https://www.honda.com.mx/assets/img/auto/civic/colores/cosmic-blue.jpg'
        },
        {
          id: 3,
          marca: 'Ford',
          modelo: 'Explorer',
          anio: 2023,
          año: 2023,
          tipo: 'SUV',
          tipoCoche: 'SUV',
          color: 'Negro',
          matricula: 'DEF-456',
          disponible: true,
          precioBase: 75,
          precioDia: 75,
          imagen: 'https://www.ford.mx/content/dam/Ford/website-assets/latam/mx/nameplate/explorer/2022/overview/new/ford-explorer-2022-camioneta-familia-diseno-exterior-color-rojo-lucid.jpg.dam.full.high.jpg/1642097494293.jpg'
        }
      ];
      
      saveLocalData('autos', sampleData);
      return { success: true, data: sampleData };
    } catch (error) {
      console.error('Error general en autos.getAll:', error);
      return { success: false, message: error.message };
    }
  },
  
  getById: async (id) => {
    try {
      const response = await fetchWithAuth(`/api/autos/${id}`);
      if (response.success && response.data) {
        return response;
      }

      throw new Error('API request failed or returned invalid data');
    } catch (error) {
      console.error(`Error in autos.getById(${id}):`, error);
      throw error;
    }
  },
  
  create: async (autoData) => {
    try {
      // Asegurar que no haya un ID definido incorrectamente
      const autoDataToSend = { ...autoData };
      delete autoDataToSend.id; // Eliminar cualquier ID que pueda haber sido incluido
      
      console.log('Enviando solicitud para crear auto:', autoDataToSend);
      
      // Try to create in API first
      const response = await fetchWithAuth('/api/autos', {
        method: 'POST',
        body: JSON.stringify(autoDataToSend)
      });
      
      if (response.success && response.data) {
        console.log('Auto creado exitosamente en el servidor:', response.data);
        // If successful, update localStorage
        const localData = getLocalData('autos') || [];
        const newAuto = response.data;
        saveLocalData('autos', [...localData, newAuto]);
        return { success: true, data: newAuto };
      } else {
        throw new Error(response.message || 'Error al crear vehículo en el servidor');
      }
    } catch (error) {
      console.error('Error en autos.create:', error);
      // NO FALLBACK - Propagar error para que UI lo maneje
      return { success: false, error: error.message || 'Error al crear vehículo' };
    }
  },
  
  update: async (id, autoData) => {
    try {
      // Try to update in API first
      const response = await fetchWithAuth(`/api/autos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(autoData)
      });
      
      if (response.success) {
        // If successful, update localStorage
        const localData = getLocalData('autos');
        if (localData) {
          const updatedData = localData.map(auto => 
            auto.id == id ? { ...auto, ...autoData } : auto
          );
          saveLocalData('autos', updatedData);
        }
        return response;
      }
      
      throw new Error(response.message || 'Error al actualizar veh\u00edculo');
    } catch (error) {
      console.error(`Error in autos.update(${id}):`, error);
      
      // NO FALLBACK - Propagar error para que UI lo maneje
      return { success: false, error: error.message || 'Error al actualizar veh\u00edculo' };
    }
  },
  
  delete: async (id) => {
    try {
      // Try to delete in API first
      const response = await fetchWithAuth(`/api/autos/${id}`, {
        method: 'DELETE'
      });
      
      if (response.success) {
        // If successful, update localStorage
        const localData = getLocalData('autos');
        if (localData) {
          const filteredData = localData.filter(auto => auto.id != id);
          saveLocalData('autos', filteredData);
        }
        return response;
      }

      throw new Error(response.message || 'Error al eliminar veh\u00edculo');
    } catch (error) {
      console.error(`Error in autos.delete(${id}):`, error);
      
      // NO FALLBACK - Propagar error para que UI lo maneje
      return { success: false, error: error.message || 'Error al eliminar veh\u00edculo' };
    }
  },
  
  search: (params = {}) => {
    const queryParams = new URLSearchParams();
    
    // Add params to query string
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return fetchWithAuth(`/api/autos/search${queryString}`);
  }
};

// Catalogo endpoints
const catalogo = {
  getAutos: (filters = {}) => {
    const queryParams = new URLSearchParams();
    
    // Add filters to query params
    Object.entries(filters).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return fetchWithAuth(`/api/catalogo${queryString}`);
  },
  
  getAuto: (id) => fetchWithAuth(`/api/catalogo/${id}`)
};

// Reservas endpoints
const reservas = {
  getAll: async () => {
    const response = await fetchWithAuth('/api/reservas');
    if (response.success && Array.isArray(response.data)) {
      saveLocalData('reservas', response.data);
    }
    return response;
  },
  
  getUserReservas: async (userId) => {
    const response = await fetchWithAuth(`/api/usuarios/${userId}/reservas`);
    if (response.success && Array.isArray(response.data)) {
      saveLocalData('reservas', response.data);
    }
    return response;
  },
  
  getById: async (id) => {
    // Intentar localStorage primero
    const localData = getLocalData('reservas');
    if (localData && Array.isArray(localData)) {
      const reserva = localData.find(r => r.id == id);
      if (reserva) {
        console.log(`Usando reserva ${id} desde localStorage`);
        
        // Sincronizar con backend en segundo plano
        setTimeout(async () => {
          try {
            const response = await fetchWithAuth(`/api/reservas/${id}`);
            if (response.success && response.data) {
              // Actualizar en localStorage
              const allReservas = getLocalData('reservas') || [];
              const index = allReservas.findIndex(r => r.id == id);
              if (index !== -1) {
                allReservas[index] = response.data;
                saveLocalData('reservas', allReservas);
              }
            }
          } catch (error) {
            console.warn('No se pudo sincronizar reserva con backend');
          }
        }, 100);
        
        return { success: true, data: reserva, source: 'localStorage' };
      }
    }
    
    // Si no está en localStorage, intentar backend
    try {
      console.log(`Obteniendo reserva ${id} desde backend`);
      const response = await fetchWithAuth(`/api/reservas/${id}`);
      
      if (response.success && response.data) {
        // Guardar en localStorage
        const allReservas = getLocalData('reservas') || [];
        const index = allReservas.findIndex(r => r.id == id);
        if (index !== -1) {
          allReservas[index] = response.data;
        } else {
          allReservas.push(response.data);
        }
        saveLocalData('reservas', allReservas);
        return response;
      }
      
      console.warn('Backend no retornó la reserva');
      return { success: false, message: 'Reserva no encontrada' };
    } catch (error) {
      console.warn(`Error obteniendo reserva ${id}:`, error.message);
      return { success: false, message: 'Error al obtener la reserva' };
    }
  },
  
  create: async (reservaData) => {
    const payload = {
      fechaInicio: reservaData.fechaInicio,
      fechaFin: reservaData.fechaFin,
      usuario: reservaData.usuario || reservaData.usuarioId,
      autoId: reservaData.autoId,
      metodoPago: reservaData.metodoPago,
      datosPago: reservaData.datosPago,
      porcentajeAnticipo: reservaData.porcentajeAnticipo,
      montoAnticipo: reservaData.montoAnticipo,
      saldoPendiente: reservaData.saldoPendiente,
      estadoPago: reservaData.estadoPago,
      pasarelaPago: reservaData.pasarelaPago,
      referenciaPago: reservaData.referenciaPago
    };

    const response = await fetchWithAuth('/api/reservas', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (response.success && response.data && response.data.reserva) {
      const localData = getLocalData('reservas') || [];
      saveLocalData('reservas', [...localData, response.data.reserva]);
      return { success: true, data: response.data.reserva };
    }

    return response;
  },
  
  update: async (id, reservaData) => {
    return reservas.actualizarEstadoAdmin(id, reservaData.estado);
  },

  actualizarEstadoAdmin: async (id, estado) => {
    const response = await fetchWithAuth(`/api/reservas/${id}/estado`, {
      method: 'PUT',
      body: JSON.stringify({ estado })
    });

    if (response.success && response.data) {
      const localData = getLocalData('reservas');
      if (localData && Array.isArray(localData)) {
        const updatedData = localData.map(reserva =>
          reserva.id == id ? { ...reserva, estado: response.data.estado } : reserva
        );
        saveLocalData('reservas', updatedData);
      }
    }

    return response;
  },
  
  delete: async (id) => {
    const response = await fetchWithAuth(`/api/reservas/${id}`, {
      method: 'DELETE'
    });

    if (response.success) {
      const localData = getLocalData('reservas');
      if (localData) {
        const filteredData = localData.filter(reserva => reserva.id != id);
        saveLocalData('reservas', filteredData);
      }
    }

    return response;
  },
  
  cancelar: async (id) => {
    const response = await fetchWithAuth(`/api/reservas/${id}/cancelar`, {
      method: 'PUT'
    });

    if (response.success) {
      const localData = getLocalData('reservas');
      if (localData) {
        const updatedData = localData.map(reserva =>
          reserva.id == id ? { ...reserva, estado: 'Cancelada' } : reserva
        );
        saveLocalData('reservas', updatedData);
      }
    }

    return response;
  },
  
  generarFactura: (id) => fetchWithAuth(`/api/reservas/${id}/factura`),
  
  calcularPrecio: (datos) => fetchWithAuth('/api/reservas/calcular-precio', {
    method: 'POST',
    body: JSON.stringify(datos)
  }),
  
  getByUsuario: (usuarioId) => fetchWithAuth(`/api/usuarios/${usuarioId}/reservas`)
};

// Dashboard endpoints (for admin)
const dashboard = {
  getEstadisticas: () => fetchWithAuth('/api/dashboard/estadisticas'),
  
  getReservasRecientes: () => fetchWithAuth('/api/dashboard/reservas-recientes'),
  
  getUsuariosRecientes: () => fetchWithAuth('/api/dashboard/usuarios-recientes'),
  
  getIngresos: (periodo) => fetchWithAuth(`/api/dashboard/ingresos?periodo=${periodo}`),
  
  getDisponibilidad: () => fetchWithAuth('/api/dashboard/disponibilidad')
};

// Añadir el servicio para subir imágenes
const uploads = {
  /**
   * Sube una imagen al servidor
   * @param {File} file - Archivo de imagen a subir
   * @returns {Promise<Object>} - Respuesta con la ruta de la imagen
   */
  uploadImage: async (file) => {
    try {
      if (!file) {
        console.warn('No se proporcionó ningún archivo para subir');
        return { success: false, message: 'No se proporcionó ningún archivo' };
      }
      
      // Crear FormData para enviar el archivo
      const formData = new FormData();
      formData.append('file', file);
      
      // Obtener token de autenticación
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      // Preparar headers
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      let response;
      let lastError;

      for (const baseUrl of getOrderedApiCandidates()) {
        const fullUrl = `${baseUrl}/api/upload`;
        console.log('Subiendo imagen al servidor backend:', fullUrl);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
          response = await fetch(fullUrl, {
            method: 'POST',
            body: formData,
            headers,
            mode: 'cors',
            credentials: 'same-origin',
            cache: 'no-cache',
            signal: controller.signal
          });

          clearTimeout(timeoutId);
          preferredApiBaseUrl = baseUrl;
          break;
        } catch (candidateError) {
          clearTimeout(timeoutId);
          lastError = candidateError;

          const isNetworkIssue =
            candidateError?.name === 'AbortError' ||
            (candidateError instanceof TypeError && /fetch|network/i.test(candidateError.message));

          if (!isNetworkIssue) {
            throw candidateError;
          }

          console.warn(`No se pudo conectar a ${fullUrl}:`, candidateError.message);
        }
      }

      if (!response) {
        throw lastError || new Error('No se pudo establecer conexión con la API');
      }
      
      if (!response.ok) {
        let errorMessage = 'Error al subir la imagen';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = `Error del servidor: ${response.status} ${response.statusText}`;
        }
        console.warn('Error en la respuesta de upload:', errorMessage);
        return { success: false, message: errorMessage };
      }
      
      const result = await response.json();
      console.log('Imagen subida exitosamente:', result);
      return result;
    } catch (error) {
      console.warn('Error al subir imagen:', error.message);
      return {
        success: false,
        message: error.message || 'Error de conexión al subir la imagen',
      };
    }
  }
};

// Checklist endpoints - Basado en localStorage con sincronización opcional a backend
const checklists = {
  /**
   * Obtiene todos los checklists del localStorage
   * @returns {Object} - Objeto con todos los checklists indexados por autoId
   */
  _getChecklistsFromStorage: () => {
    if (typeof window === 'undefined') return {};
    const stored = localStorage.getItem('vehicleChecklists');
    return stored ? JSON.parse(stored) : {};
  },

  /**
   * Guarda todos los checklists en localStorage
   * @param {Object} checklists - Objeto con todos los checklists
   */
  _saveChecklistsToStorage: (checklists) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('vehicleChecklists', JSON.stringify(checklists));
  },

  /**
   * Crea un checklist por defecto
   * @param {number} autoId - ID del vehículo
   * @returns {Object} - Checklist con valores por defecto
   */
  _createDefaultChecklist: (autoId) => {
    return {
      id: `checklist_${autoId}_${Date.now()}`,
      idAuto: parseInt(autoId),
      nivelGasolina: 'Lleno',
      porcentajeGasolina: 100,
      rayones: [],
      inventario: [
        { id: `inv_${Date.now()}_1`, nombre: 'Gato hidráulico', presente: true, condicion: 'Bueno', notas: '' },
        { id: `inv_${Date.now()}_2`, nombre: 'Llanta de repuesto', presente: true, condicion: 'Bueno', notas: '' },
        { id: `inv_${Date.now()}_3`, nombre: 'Llave de ruedas', presente: true, condicion: 'Bueno', notas: '' },
        { id: `inv_${Date.now()}_4`, nombre: 'Triángulos de seguridad', presente: true, condicion: 'Bueno', notas: '' },
        { id: `inv_${Date.now()}_5`, nombre: 'Botiquín de primeros auxilios', presente: true, condicion: 'Bueno', notas: '' },
        { id: `inv_${Date.now()}_6`, nombre: 'Extintor', presente: true, condicion: 'Bueno', notas: '' },
        { id: `inv_${Date.now()}_7`, nombre: 'Manual del vehículo', presente: true, condicion: 'Bueno', notas: '' },
        { id: `inv_${Date.now()}_8`, nombre: 'Cables de arranque', presente: true, condicion: 'Bueno', notas: '' }
      ],
      estadoGeneral: 'Bueno',
      observaciones: '',
      fechaUltimaRevision: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sincronizado: false
    };
  },

  /**
   * Sincroniza checklist con el backend (opcional)
   * @param {number} autoId - ID del vehículo
   * @param {Object} checklistData - Datos del checklist
   */
  _syncToBackend: async (autoId, checklistData) => {
    try {
      // Intentar sincronizar con el backend, pero no fallar si no funciona
      await fetchWithAuth(`/api/autos/${autoId}/checklist`, {
        method: 'PUT',
        body: JSON.stringify(checklistData)
      });
      console.log(`✓ Checklist del auto ${autoId} sincronizado con el backend`);
      return true;
    } catch (error) {
      console.warn(`⚠ No se pudo sincronizar checklist del auto ${autoId} con backend:`, error.message);
      return false;
    }
  },

  /**
   * Obtiene el checklist de un vehículo (localStorage primero)
   * @param {number} autoId - ID del vehículo
   * @returns {Promise<Object>} - Respuesta con los datos del checklist
   */
  getByAuto: async (autoId) => {
    try {
      // Obtener de localStorage primero
      const allChecklists = checklists._getChecklistsFromStorage();
      let checklist = allChecklists[autoId];
      
      // Si no existe, crear uno nuevo
      if (!checklist) {
        console.log(`Creando nuevo checklist para auto ${autoId}`);
        checklist = checklists._createDefaultChecklist(autoId);
        allChecklists[autoId] = checklist;
        checklists._saveChecklistsToStorage(allChecklists);
      }
      
      // Intentar sincronizar con backend en segundo plano (no bloqueante)
      checklists._syncToBackend(autoId, checklist).then(synced => {
        if (synced) {
          checklist.sincronizado = true;
          allChecklists[autoId] = checklist;
          checklists._saveChecklistsToStorage(allChecklists);
        }
      });
      
      return {
        success: true,
        data: checklist,
        source: 'localStorage'
      };
    } catch (error) {
      console.error(`Error al obtener checklist del auto ${autoId}:`, error);
      throw error;
    }
  },
  
  /**
   * Actualiza el checklist de un vehículo (localStorage primero)
   * @param {number} autoId - ID del vehículo
   * @param {Object} checklistData - Datos del checklist a actualizar
   * @returns {Promise<Object>} - Respuesta con el checklist actualizado
   */
  update: async (autoId, checklistData) => {
    try {
      // Obtener checklists actuales
      const allChecklists = checklists._getChecklistsFromStorage();
      let checklist = allChecklists[autoId];
      
      // Si no existe, crear uno nuevo
      if (!checklist) {
        checklist = checklists._createDefaultChecklist(autoId);
      }
      
      // Actualizar campos
      checklist = {
        ...checklist,
        ...checklistData,
        updatedAt: new Date().toISOString(),
        sincronizado: false
      };
      
      // Guardar en localStorage inmediatamente
      allChecklists[autoId] = checklist;
      checklists._saveChecklistsToStorage(allChecklists);
      
      // Intentar sincronizar con backend en segundo plano
      checklists._syncToBackend(autoId, checklist).then(synced => {
        if (synced) {
          checklist.sincronizado = true;
          allChecklists[autoId] = checklist;
          checklists._saveChecklistsToStorage(allChecklists);
        }
      });
      
      return {
        success: true,
        data: checklist,
        source: 'localStorage'
      };
    } catch (error) {
      console.error(`Error al actualizar checklist del auto ${autoId}:`, error);
      throw error;
    }
  },
  
  /**
   * Agrega un rayón al checklist (localStorage primero)
   * @param {number} autoId - ID del vehículo
   * @param {Object} rayonData - Datos del rayón (descripcion, ubicacion)
   * @returns {Promise<Object>} - Respuesta con el checklist actualizado
   */
  agregarRayon: async (autoId, rayonData) => {
    try {
      // Obtener checklist actual
      const allChecklists = checklists._getChecklistsFromStorage();
      let checklist = allChecklists[autoId];
      
      if (!checklist) {
        checklist = checklists._createDefaultChecklist(autoId);
      }
      
      // Agregar nuevo rayón
      const nuevoRayon = {
        id: `rayon_${Date.now()}`,
        descripcion: rayonData.descripcion,
        ubicacion: rayonData.ubicacion,
        fecha: new Date().toISOString()
      };
      
      checklist.rayones = [...(checklist.rayones || []), nuevoRayon];
      checklist.updatedAt = new Date().toISOString();
      checklist.sincronizado = false;
      
      // Guardar en localStorage inmediatamente
      allChecklists[autoId] = checklist;
      checklists._saveChecklistsToStorage(allChecklists);
      
      // Sincronizar con backend en segundo plano
      checklists._syncToBackend(autoId, checklist);
      
      return {
        success: true,
        data: checklist,
        source: 'localStorage'
      };
    } catch (error) {
      console.error(`Error al agregar rayón al auto ${autoId}:`, error);
      throw error;
    }
  },
  
  /**
   * Elimina un rayón del checklist (localStorage primero)
   * @param {number} autoId - ID del vehículo
   * @param {string} rayonId - ID del rayón a eliminar
   * @returns {Promise<Object>} - Respuesta con el checklist actualizado
   */
  eliminarRayon: async (autoId, rayonId) => {
    try {
      // Obtener checklist actual
      const allChecklists = checklists._getChecklistsFromStorage();
      let checklist = allChecklists[autoId];
      
      if (!checklist) {
        throw new Error('Checklist no encontrado');
      }
      
      // Eliminar rayón
      checklist.rayones = (checklist.rayones || []).filter(r => r.id !== rayonId);
      checklist.updatedAt = new Date().toISOString();
      checklist.sincronizado = false;
      
      // Guardar en localStorage inmediatamente
      allChecklists[autoId] = checklist;
      checklists._saveChecklistsToStorage(allChecklists);
      
      // Sincronizar con backend en segundo plano
      checklists._syncToBackend(autoId, checklist);
      
      return {
        success: true,
        data: checklist,
        source: 'localStorage'
      };
    } catch (error) {
      console.error(`Error al eliminar rayón del auto ${autoId}:`, error);
      throw error;
    }
  },
  
  /**
   * Obtiene todos los checklists del localStorage
   * @returns {Promise<Object>} - Respuesta con la lista de checklists
   */
  getAll: async () => {
    try {
      const allChecklists = checklists._getChecklistsFromStorage();
      const checklistsArray = Object.values(allChecklists);
      
      return {
        success: true,
        data: checklistsArray,
        count: checklistsArray.length,
        source: 'localStorage'
      };
    } catch (error) {
      console.error('Error al obtener todos los checklists:', error);
      throw error;
    }
  }
};

// Exportar los servicios
const apiService = {
  auth,
  usuarios,
  autos,
  reservas,
  catalogo,
  uploads,
  checklists
};

export default apiService;
