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

### Configuración del Backend
```bash
cd rentacar/back
npm install
npm start
```

### Configuración del Frontend
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

```
MONGODB_URI=mongodb://localhost:27017/rentacar
PORT=3000
JWT_SECRET=tu_secreto_para_tokens
```

Ajusta las variables según tu entorno (por ejemplo, si usas Mongo Atlas, usa la cadena de conexión correspondiente).

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3000
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

## 🔗 Enlaces Importantes
- API: `http://localhost:3000/api`
- Frontend: `http://localhost:3000`

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
