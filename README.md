# 🚗 Proyecto RentaCar

## 📋 Descripción General
Sistema de gestión de alquiler de vehículos desarrollado con tecnologías web modernas. Permite a los usuarios explorar vehículos disponibles, realizar reservas y a los administradores gestionar la flota.

## 🛠 Tecnologías Utilizadas
- **Backend**: Node.js + Express
- **Frontend**: Next.js
- **Base de Datos**: MongoDB
- **Autenticación**: JWT

## 📁 Estructura del Proyecto
```
rentacar/
├── back/               # API y servicios del backend
│   ├── src/           
│   │   ├── controllers/   # Controladores
│   │   ├── models/       # Modelos de datos
│   │   └── routes/       # Rutas de la API
│   └── scripts/      # Scripts de utilidad
├── front/            # Aplicación frontend (Next.js)
│   └── files/       
│       ├── src/     # Código fuente
│       └── public/  # Archivos estáticos
├── wireframes/       # 📐 Wireframes de todas las páginas
└── query/           # Archivos de base de datos
```

## 📐 Wireframes y Diseño

Los wireframes completos de todas las páginas del sistema están disponibles en la carpeta [`/wireframes`](./wireframes/README.md).

**Incluye:**
- ✅ Diagramas visuales en formato Mermaid
- ✅ Flujos de navegación
- ✅ Descripciones detalladas de componentes
- ✅ Estados de cada página
- ✅ Layouts responsivos (Desktop/Tablet/Mobile)

**Páginas documentadas:**
- Públicas: Home, Login, Registro, Catálogo, Detalle de Auto
- Usuario: Mis Reservas, Nueva Reserva, Detalle de Reserva, Perfil
- Admin: Dashboard, Gestión de Vehículos, Usuarios y Reservas

👉 **[Ver todos los wireframes aquí](./wireframes/README.md)**

## ⚡ Inicio Rápido

### Requisitos Previos
- Node.js v16+
- MongoDB
- npm o yarn

### Configuración del Backend
```bash
cd rentacar/back
npm install

# Inicializar usuario administrador en MongoDB (ejecutar solo la primera vez)
node init-admin.js

# Iniciar el servidor
npm start
```

### Configuración del Frontend
```bash
cd rentacar/front/files
npm install
npm run dev
```

## 🔑 Credenciales de Prueba

Para probar la aplicación, puedes usar estas credenciales de desarrollo:

### Usuario Administrador
- **Email:** `admin@rentacar.com`
- **Contraseña:** `admin123`
- **Rol:** Administrador (acceso completo al panel de administración)

### Usuario Cliente (Registro)
También puedes crear nuevos usuarios cliente registrándote en la aplicación.

**Nota Importante:** 
- El usuario administrador debe ser inicializado en MongoDB antes del primer uso
- Ejecuta `node init-admin.js` en la carpeta `rentacar/back` para crear el usuario admin
- Estas credenciales son solo para desarrollo/testing

## 🔧 Solución de Problemas

### Error "Token inválido" en el Dashboard

Si recibes errores de token inválido al acceder al dashboard:

1. **Asegúrate de que MongoDB esté corriendo**
   ```bash
   # En Windows, verifica el servicio MongoDB
   net start MongoDB
   ```

2. **Inicializa el usuario administrador**
   ```bash
   cd rentacar/back
   node init-admin.js
   ```

3. **Limpia el localStorage del navegador**
   - Abre las DevTools (F12)
   - Ve a Application > Local Storage
   - Elimina las entradas de `token` y `user`
   - Vuelve a iniciar sesión

4. **Reinicia el servidor backend**
   ```bash
   cd rentacar/back
   # Detén el servidor (Ctrl+C) y vuelve a iniciarlo
   node index.js
   ```

## 🔑 Características Principales
- Gestión de catálogo de vehículos
- Sistema de reservas
- Autenticación de usuarios
- Panel de administración
- API REST
- Diseño responsivo

## 🔗 URLs del Proyecto

Después de iniciar el proyecto con `.\start.ps1`:

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5001
- **Login de prueba:** http://localhost:3000/login (usa admin@rentacar.com / admin123)

## 👥 Cómo Contribuir
1. Clona el repositorio
2. Crea una rama para tu función (`git checkout -b feature/NuevaFuncion`)
3. Realiza tus cambios
4. Haz commit de tus cambios (`git commit -m 'Añadir nueva función'`)
5. Sube la rama (`git push origin feature/NuevaFuncion`)
6. Abre un Pull Request

## 📝 Notas Adicionales
- Los archivos `.env` no se incluyen en el repositorio
- Datos de ejemplo disponibles en `front/files/public/data/`
- Consulta la documentación específica en cada carpeta para más detalles

## 🤝 Soporte
Para dudas o problemas, abre un issue en el repositorio.
