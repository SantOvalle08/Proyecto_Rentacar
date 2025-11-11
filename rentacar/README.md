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
└── query/           # Archivos de base de datos
```

## ⚡ Inicio Rápido

### Requisitos Previos
- Node.js v16+
- MongoDB
- npm o yarn

### Opción 1: Usar scripts de PowerShell (Recomendado)

```powershell
# Iniciar todo el proyecto
.\start.ps1

# Detener todo el proyecto
.\stop.ps1
```

### Opción 2: Configuración Manual

#### Backend
```bash
cd rentacar/back
npm install
npm start
```

#### Frontend
```bash
cd rentacar/front/files
npm install
npm run dev
```

## 🔑 Características Principales
- Gestión de catálogo de vehículos
- Sistema de reservas
- Autenticación de usuarios
- Panel de administración
- API REST
- Diseño responsivo

## ⚙️ Variables de Entorno

### Backend (.env)
Crea un archivo `.env` en `rentacar/back/`:
```
MONGODB_URI=mongodb://localhost:27017/rentacar
PORT=5001
JWT_SECRET=tu_secreto_para_tokens
NODE_ENV=development
```

### Frontend (.env.local)
Crea un archivo `.env.local` en `rentacar/front/files/`:
```
NEXT_PUBLIC_API_URL=http://localhost:5001
```

## 📜 Scripts Útiles

### Backend
- `start-server.js`: Inicia el servidor
- `test-db.js`: Prueba la conexión a la base de datos
- `sync-catalog.js`: Sincroniza el catálogo
- `json-to-mongodb.js`: Importa datos JSON a MongoDB

### Frontend
- `npm run dev`: Inicia el servidor de desarrollo
- `npm run build`: Construye la aplicación
- `npm start`: Inicia la aplicación en producción

## 🔗 URLs del Proyecto

Después de iniciar el proyecto con `.\start.ps1`:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001

## 🐛 Solución de Problemas

### Error de conexión al frontend
- Asegúrate de que el backend esté corriendo en el puerto 5001
- Verifica que el archivo `.env.local` del frontend tenga la URL correcta del backend

### Error de MongoDB
- Asegúrate de que MongoDB esté instalado y corriendo
- Verifica la cadena de conexión en el archivo `.env` del backend

### Puerto ocupado
- Usa `.\stop.ps1` para detener todos los procesos
- O manualmente: `Get-Process node | Stop-Process -Force`

## 👥 Cómo Contribuir
1. Clona el repositorio
2. Crea una rama para tu función (`git checkout -b feature/NuevaFuncion`)
3. Realiza tus cambios
4. Haz commit de tus cambios (`git commit -m 'Añadir nueva función'`)
5. Sube la rama (`git push origin feature/NuevaFuncion`)
6. Abre un Pull Request

## 📝 Notas Adicionales
- Los archivos `.env` y `.env.local` no se incluyen en el repositorio por seguridad
- Archivos de ejemplo: `.env.example` (backend) y `.env.example` (frontend)
- Datos de ejemplo disponibles en `front/files/public/data/`
- Consulta la documentación específica en cada carpeta para más detalles

## 🤝 Soporte
Para dudas o problemas, abre un issue en el repositorio.
