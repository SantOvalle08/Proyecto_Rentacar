// API Service for RentaCar app

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

// Helper function for fetch requests
const fetchWithAuth = async (url, options = {}) => {
  try {
    console.log(`Realizando solicitud a: ${API_BASE_URL}${url}`, {
      method: options.method || 'GET',
      body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined
    });
    
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
    
    // Log detallado para depuración
    console.log('Request completo:', {
      url: `${API_BASE_URL}${url}`,
      method: options.method || 'GET',
      headers,
      body: options.body
    });
    
    // Añadir un timeout para la solicitud
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos
    
    // Make the request with CORS options
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
      mode: 'cors',
      cache: 'no-cache',
      credentials: 'same-origin',
      signal: controller.signal
    });
    
    // Clear timeout
    clearTimeout(timeoutId);
    
    console.log('Respuesta recibida:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries([...response.headers])
    });
    
    // Handle 204 No Content
    if (response.status === 204) {
      return { success: true };
    }
    
    // Capture non-JSON responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('Respuesta JSON:', data);
      
      // If response is not ok, throw an error
      if (!response.ok) {
        console.error('Error en respuesta del servidor:', data);
        throw new Error(data.message || 'Ocurrió un error en la solicitud');
      }
      
      return data;
    } else {
      const text = await response.text();
      console.log('Respuesta texto:', text);
      
      if (!response.ok) {
        throw new Error('Respuesta inválida del servidor');
      }
      
      // Try to parse as JSON if possible
      try {
        return JSON.parse(text);
      } catch (e) {
        // Return text response as success
        return { success: true, message: text };
      }
    }
  } catch (error) {
    // Check if it's a timeout error
    if (error.name === 'AbortError') {
      console.error('Timeout en la solicitud');
      throw new Error('La solicitud ha excedido el tiempo de espera. Verifique que el servidor esté respondiendo.');
    }
    
    // Check if it's a network error
    if (error instanceof TypeError && error.message.includes('NetworkError')) {
      console.error('Error de red:', error);
      throw new Error('Error de conexión con el servidor. Verifique que el servidor esté en ejecución y accesible. Si está usando Firefox, pruebe con Chrome o Edge.');
    }
    
    // Check if it's a CORS error
    if (error instanceof DOMException && error.name === 'NetworkError') {
      console.error('Error CORS:', error);
      throw new Error('Error de CORS. Pruebe abriendo la aplicación en Chrome con --disable-web-security o use otro navegador.');
    }
    
    // Check if it's a JSON parsing error
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      console.error('Error al analizar respuesta JSON:', error);
      throw new Error('Error en formato de respuesta del servidor');
    }
    
    // Re-throw other errors
    console.error('Error general en fetch:', error);
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
    console.error(`Error getting ${key} from localStorage:`, error);
    return null;
  }
};

// Save data to localStorage
const saveLocalData = (key, data) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(localStorageKeys[key], JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
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
const usuarios = {
  getAll: async () => {
    try {
      // Try to get from API first
      const response = await fetchWithAuth('/api/usuarios');
      
      if (response.success && response.data) {
        // If successful, update localStorage
        saveLocalData('usuarios', response.data);
        return response;
      }
      
      throw new Error('API request failed or returned invalid data');
    } catch (error) {
      console.error('Error in usuarios.getAll, using localStorage:', error);
      
      // Fallback to localStorage
      const localData = getLocalData('usuarios');
      if (localData) {
        return { success: true, data: localData };
      }
      
      // If no localStorage data, throw the original error
      throw error;
    }
  },
  
  getById: async (id) => {
    try {
      // Try to get from API first
      const response = await fetchWithAuth(`/api/usuarios/${id}`);
      
      if (response.success && response.data) {
        return response;
      }
      
      throw new Error('API request failed or returned invalid data');
    } catch (error) {
      console.error(`Error in usuarios.getById(${id}), using localStorage:`, error);
      
      // Fallback to localStorage
      const localData = getLocalData('usuarios');
      if (localData) {
        const usuario = localData.find(u => u.id == id);
        if (usuario) {
          return { success: true, data: usuario };
        }
      }
      
      // If no localStorage data, throw the original error
      throw error;
    }
  },
  
  create: async (usuarioData) => {
    try {
      // Try to create in API first
      const response = await fetchWithAuth('/api/usuarios', {
        method: 'POST',
        body: JSON.stringify(usuarioData)
      });
      
      if (response.success) {
        // If successful, update localStorage
        const localData = getLocalData('usuarios') || [];
        const newUsuario = response.data || { ...usuarioData, id: Date.now(), idUser: Date.now() };
        saveLocalData('usuarios', [...localData, newUsuario]);
        return { success: true, data: newUsuario };
      }
      
      throw new Error('API request failed or returned invalid data');
    } catch (error) {
      console.error('Error in usuarios.create, using localStorage:', error);
      
      // Fallback to localStorage
      const localData = getLocalData('usuarios') || [];
      const newUsuario = { ...usuarioData, id: Date.now(), idUser: Date.now() };
      saveLocalData('usuarios', [...localData, newUsuario]);
      
      return { success: true, data: newUsuario };
    }
  },
  
  update: async (id, usuarioData) => {
    try {
      // Try to update in API first
      const response = await fetchWithAuth(`/api/usuarios/${id}`, {
        method: 'PUT',
        body: JSON.stringify(usuarioData)
      });
      
      if (response.success) {
        // If successful, update localStorage
        const localData = getLocalData('usuarios');
        if (localData) {
          const updatedData = localData.map(usuario => 
            usuario.id == id ? { ...usuario, ...usuarioData } : usuario
          );
          saveLocalData('usuarios', updatedData);
        }
        return response;
      }
      
      throw new Error('API request failed or returned invalid data');
    } catch (error) {
      console.error(`Error in usuarios.update(${id}), using localStorage:`, error);
      
      // Fallback to localStorage
      const localData = getLocalData('usuarios');
      if (localData) {
        const updatedData = localData.map(usuario => 
          usuario.id == id ? { ...usuario, ...usuarioData } : usuario
        );
        saveLocalData('usuarios', updatedData);
        return { success: true };
      }
      
      // If no localStorage data, throw the original error
      throw error;
    }
  },
  
  delete: async (id) => {
    try {
      // Try to delete in API first
      const response = await fetchWithAuth(`/api/usuarios/${id}`, {
        method: 'DELETE'
      });
      
      if (response.success) {
        // If successful, update localStorage
        const localData = getLocalData('usuarios');
        if (localData) {
          const filteredData = localData.filter(usuario => usuario.id != id);
          saveLocalData('usuarios', filteredData);
        }
        return response;
      }
      
      throw new Error('API request failed or returned invalid data');
    } catch (error) {
      console.error(`Error in usuarios.delete(${id}), using localStorage:`, error);
      
      // Fallback to localStorage
      const localData = getLocalData('usuarios');
      if (localData) {
        const filteredData = localData.filter(usuario => usuario.id != id);
        saveLocalData('usuarios', filteredData);
        return { success: true };
      }
      
      // If no localStorage data, throw the original error
      throw error;
    }
  },
  
  getProfile: () => fetchWithAuth('/api/usuarios/perfil'),
  
  updateProfile: (userData) => fetchWithAuth('/api/usuarios/perfil', {
    method: 'PUT',
    body: JSON.stringify(userData)
  })
};

// Auto endpoints with localStorage fallback/syncing
const autos = {
  getAll: async () => {
    try {
      console.log('API Service: Obteniendo lista de autos');
      
      // Función auxiliar para sincronizar datos JSON con el backend
      const syncJsonDataWithBackend = async (jsonData) => {
        // Solo importar si tenemos datos
        if (!Array.isArray(jsonData) || jsonData.length === 0) return;
        
        console.log(`Sincronizando ${jsonData.length} autos con el backend`);
        
        // Intentar crear cada auto en el backend
        for (const auto of jsonData) {
          try {
            await fetchWithAuth('/api/autos', {
              method: 'POST',
              body: JSON.stringify(auto)
            });
            console.log(`Auto sincronizado: ${auto.marca} ${auto.modelo}`);
          } catch (error) {
            console.error(`Error al sincronizar auto ${auto.marca} ${auto.modelo}:`, error);
          }
        }
      };
      
      // Intento 1: Obtener desde la API principal
      try {
        console.log('Intentando obtener autos desde la API principal: /api/autos');
        const response = await fetchWithAuth('/api/autos');
        console.log('Respuesta de API principal:', response);
        
        if (response.success && Array.isArray(response.data) && response.data.length > 0) {
          console.log(`API principal retornó ${response.data.length} autos`);
          saveLocalData('autos', response.data);
          return response;
        } else {
          console.log('API principal no retornó autos válidos');
        }
      } catch (error) {
        console.error('Error getting autos from API:', error);
      }
      
      // Intento 2: Obtener desde el catálogo (ruta pública)
      try {
        console.log('Intentando obtener autos desde el catálogo: /api/catalogo');
        const response = await fetchWithAuth('/api/catalogo');
        console.log('Respuesta de catálogo:', response);
        
        if (response.success && Array.isArray(response.data) && response.data.length > 0) {
          console.log(`Catálogo retornó ${response.data.length} autos`);
          saveLocalData('autos', response.data);
          return response;
        } else {
          console.log('Catálogo no retornó autos válidos');
        }
      } catch (error) {
        console.error('Error getting autos from catalog:', error);
      }
      
      // Intento 3: Obtener desde localStorage
      const localData = getLocalData('autos');
      if (localData && Array.isArray(localData) && localData.length > 0) {
        console.log('Usando datos de vehículos desde localStorage:', localData.length);
        return { success: true, data: localData };
      }
      
      // Intento 4: Cargar desde archivo JSON local
      try {
        console.log('Intentando cargar datos desde archivo JSON local');
        const response = await fetch('/data/autos.json');
        
        if (response.ok) {
          const jsonData = await response.json();
          if (Array.isArray(jsonData) && jsonData.length > 0) {
            console.log('Datos cargados desde archivo JSON local:', jsonData.length);
            
            // Intentar sincronizar con el backend si está disponible
            try {
              console.log('Intentando sincronizar datos JSON con el backend');
              await syncJsonDataWithBackend(jsonData);
            } catch (syncError) {
              console.error('Error al sincronizar con backend:', syncError);
            }
            
            saveLocalData('autos', jsonData);
            return { success: true, data: jsonData };
          }
        }
      } catch (error) {
        console.error('Error loading from local JSON:', error);
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
      // Try to get from API first
      const response = await fetchWithAuth(`/api/autos/${id}`);
      
      if (response.success && response.data) {
        return response;
      }
      
      throw new Error('API request failed or returned invalid data');
    } catch (error) {
      console.error(`Error in autos.getById(${id}), using localStorage:`, error);
      
      // Fallback to localStorage
      const localData = getLocalData('autos');
      if (localData) {
        const auto = localData.find(a => a.id == id);
        if (auto) {
          return { success: true, data: auto };
        }
      }
      
      // If no localStorage data, throw the original error
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
        console.error('La API devolvió éxito pero sin datos de vehículo');
        throw new Error('La API no devolvió datos del vehículo creado');
      }
    } catch (error) {
      console.error('Error in autos.create, using localStorage:', error);
      
      // Fallback to localStorage - crear un ID numérico pequeño
      const localData = getLocalData('autos') || [];
      
      // Encontrar el ID más alto en los datos locales y agregar 1
      const highestId = localData.reduce((max, auto) => {
        const autoId = parseInt(auto.id);
        return isNaN(autoId) ? max : Math.max(max, autoId);
      }, 0);
      
      const newId = highestId + 1;
      
      const newAuto = { 
        ...autoData, 
        id: newId, 
        idAuto: newId,
        // Asegurar que tenemos todos los campos necesarios con valores consistentes
        anio: autoData.anio || autoData.año || new Date().getFullYear(),
        año: autoData.anio || autoData.año || new Date().getFullYear(),
        tipoCoche: autoData.tipoCoche || autoData.tipo || 'Sedan',
        tipo: autoData.tipoCoche || autoData.tipo || 'Sedan',
        precioDia: autoData.precioDia || autoData.precioBase || 0,
        precioBase: autoData.precioDia || autoData.precioBase || 0
      };
      
      saveLocalData('autos', [...localData, newAuto]);
      console.log('Auto guardado en localStorage con ID:', newId);
      
      return { success: true, data: newAuto };
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
      
      throw new Error('API request failed or returned invalid data');
    } catch (error) {
      console.error(`Error in autos.update(${id}), using localStorage:`, error);
      
      // Fallback to localStorage
      const localData = getLocalData('autos');
      if (localData) {
        const updatedData = localData.map(auto => 
          auto.id == id ? { ...auto, ...autoData } : auto
        );
        saveLocalData('autos', updatedData);
        return { success: true };
      }
      
      // If no localStorage data, throw the original error
      throw error;
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
      
      throw new Error('API request failed or returned invalid data');
    } catch (error) {
      console.error(`Error in autos.delete(${id}), using localStorage:`, error);
      
      // Fallback to localStorage
      const localData = getLocalData('autos');
      if (localData) {
        const filteredData = localData.filter(auto => auto.id != id);
        saveLocalData('autos', filteredData);
        return { success: true };
      }
      
      // If no localStorage data, throw the original error
      throw error;
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
    try {
      // Try to get from API first
      const response = await fetchWithAuth('/api/reservas');
      
      if (response.success && response.data) {
        // If successful, update localStorage
        saveLocalData('reservas', response.data);
        return response;
      }
      
      throw new Error('API request failed or returned invalid data');
    } catch (error) {
      console.error('Error in reservas.getAll, using localStorage:', error);
      
      // Fallback to localStorage
      const localData = getLocalData('reservas');
      if (localData) {
        return { success: true, data: localData };
      }
      
      // If no localStorage data, throw the original error
      throw error;
    }
  },
  
  getUserReservas: async (userId) => {
    try {
      // Try to get from API first
      const response = await fetchWithAuth(`/api/reservas/usuario/${userId}`);
      
      if (response.success && response.data) {
        return response;
      }
      
      throw new Error('API request failed or returned invalid data');
    } catch (error) {
      console.error(`Error in reservas.getUserReservas(${userId}), using localStorage:`, error);
      
      // Fallback to localStorage
      const localData = getLocalData('reservas');
      if (localData) {
        const userReservas = localData.filter(r => r.usuario && r.usuario.id == userId);
        if (userReservas) {
          return { success: true, data: userReservas };
        }
      }
      
      // If no localStorage data, throw the original error
      throw error;
    }
  },
  
  getById: async (id) => {
    try {
      // Try to get from API first
      const response = await fetchWithAuth(`/api/reservas/${id}`);
      
      if (response.success && response.data) {
        return response;
      }
      
      throw new Error('API request failed or returned invalid data');
    } catch (error) {
      console.error(`Error in reservas.getById(${id}), using localStorage:`, error);
      
      // Fallback to localStorage
      const localData = getLocalData('reservas');
      if (localData) {
        const reserva = localData.find(r => r.id == id);
        if (reserva) {
          return { success: true, data: reserva };
        }
      }
      
      // If no localStorage data, throw the original error
      throw error;
    }
  },
  
  create: async (reservaData) => {
    try {
      // Try to create in API first
      const response = await fetchWithAuth('/api/reservas', {
        method: 'POST',
        body: JSON.stringify(reservaData)
      });
      
      if (response.success) {
        // If successful, update localStorage
        const localData = getLocalData('reservas') || [];
        // Usar el ID generado por la API o el proporcionado en los datos de la reserva
        const newReserva = response.data || reservaData;
        saveLocalData('reservas', [...localData, newReserva]);
        return { success: true, data: newReserva };
      }
      
      throw new Error('API request failed or returned invalid data');
    } catch (error) {
      console.error('Error in reservas.create, using localStorage:', error);
      
      // Fallback to localStorage - usar el ID que ya viene en los datos
      const localData = getLocalData('reservas') || [];
      const newReserva = reservaData; // Ya incluye un ID generado en el cliente
      saveLocalData('reservas', [...localData, newReserva]);
      
      return { success: true, data: newReserva };
    }
  },
  
  update: async (id, reservaData) => {
    try {
      // Try to update in API first
      const response = await fetchWithAuth(`/api/reservas/${id}`, {
        method: 'PUT',
        body: JSON.stringify(reservaData)
      });
      
      if (response.success) {
        // If successful, update localStorage
        const localData = getLocalData('reservas');
        if (localData) {
          const updatedData = localData.map(reserva => 
            reserva.id == id ? { ...reserva, ...reservaData } : reserva
          );
          saveLocalData('reservas', updatedData);
        }
        return response;
      }
      
      throw new Error('API request failed or returned invalid data');
    } catch (error) {
      console.error(`Error in reservas.update(${id}), using localStorage:`, error);
      
      // Fallback to localStorage
      const localData = getLocalData('reservas');
      if (localData) {
        const updatedData = localData.map(reserva => 
          reserva.id == id ? { ...reserva, ...reservaData } : reserva
        );
        saveLocalData('reservas', updatedData);
        return { success: true };
      }
      
      // If no localStorage data, throw the original error
      throw error;
    }
  },
  
  delete: async (id) => {
    try {
      // Try to delete in API first
      const response = await fetchWithAuth(`/api/reservas/${id}`, {
        method: 'DELETE'
      });
      
      if (response.success) {
        // If successful, update localStorage
        const localData = getLocalData('reservas');
        if (localData) {
          const filteredData = localData.filter(reserva => reserva.id != id);
          saveLocalData('reservas', filteredData);
        }
        return response;
      }
      
      throw new Error('API request failed or returned invalid data');
    } catch (error) {
      console.error(`Error in reservas.delete(${id}), using localStorage:`, error);
      
      // Fallback to localStorage
      const localData = getLocalData('reservas');
      if (localData) {
        const filteredData = localData.filter(reserva => reserva.id != id);
        saveLocalData('reservas', filteredData);
        return { success: true };
      }
      
      // If no localStorage data, throw the original error
      throw error;
    }
  },
  
  cancelar: async (id) => {
    try {
      // Try to cancel in API first
      const response = await fetchWithAuth(`/api/reservas/${id}/cancelar`, {
        method: 'PUT'
      });
      
      if (response.success) {
        // If successful, update localStorage
        const localData = getLocalData('reservas');
        if (localData) {
          const updatedData = localData.map(reserva => 
            reserva.id == id ? { ...reserva, estado: 'cancelada' } : reserva
          );
          saveLocalData('reservas', updatedData);
        }
        return response;
      }
      
      throw new Error('API request failed or returned invalid data');
    } catch (error) {
      console.error(`Error in reservas.cancelar(${id}), using localStorage:`, error);
      
      // Fallback to localStorage
      const localData = getLocalData('reservas');
      if (localData) {
        const updatedData = localData.map(reserva => 
          reserva.id == id ? { ...reserva, estado: 'cancelada' } : reserva
        );
        saveLocalData('reservas', updatedData);
        return { success: true };
      }
      
      // If no localStorage data, throw the original error
      throw error;
    }
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
        console.error('No se proporcionó ningún archivo para subir');
        return { success: false, message: 'No se proporcionó ningún archivo' };
      }
      
      // Crear FormData para enviar el archivo
      const formData = new FormData();
      formData.append('file', file);
      
      // Enviar la petición al servidor
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al subir la imagen');
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error al subir imagen:', error);
      return {
        success: false,
        message: error.message || 'Error al subir la imagen',
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