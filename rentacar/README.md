# Proyecto Rentacar

Aplicación simple de gestión de rent-a-car compuesta por un backend en Node.js (con MongoDB) y un frontend en Next.js.

Este README se encuentra en `rentacar/README.md`. La estructura principal del proyecto es:

- back/       -> Backend en Node.js (API, scripts, utils)
- front/      -> Frontend (Next.js) dentro de `front/files`
- query/      -> Archivos relacionados con la base de datos

## Resumen

El proyecto permite gestionar vehículos, usuarios y reservas. El backend expone una API REST y contiene scripts para sincronizar catálogos y datos desde JSON a MongoDB. El frontend es una aplicación Next.js que consume la API para mostrar el catálogo y permitir realizar reservas.

## Requisitos

- Node.js v16+ (recomendado)
- npm (o yarn/pnpm)
- MongoDB (local o en la nube)

## Variables de entorno (backend)

Crea un archivo `.env` dentro de `rentacar/back/` con al menos las siguientes variables:

```
MONGODB_URI=mongodb://localhost:27017/rentacar
PORT=3000
JWT_SECRET=tu_secreto_para_tokens
```

Ajusta las variables según tu entorno (por ejemplo, si usas Mongo Atlas, usa la cadena de conexión correspondiente).

## Pasos para ejecutar (rápido)

1) Backend

```powershell
cd rentacar\back
npm install
# Ejecutar servidor (puede variar según package.json)
node start-server.js
# o si hay script
npm run start
```

2) Probar conexión a la base de datos

```powershell
cd rentacar\back
node test-db.js
```

3) Frontend (desarrollo)

```powershell
cd rentacar\front\files
npm install
npm run dev
```

El frontend por defecto corre en http://localhost:3000 (o el puerto configurado por Next.js). Asegúrate de que el backend esté corriendo y la variable de entorno para la URL de la API esté configurada en `rentacar/front/files` (puede haber un archivo `services/api.js` con la URL base).

## Scripts y utilidades importantes (backend)

- `start-server.js` / `index.js`: puntos de entrada para el servidor.
- `json-to-mongodb.js`: helper para insertar datos desde JSON a MongoDB.
- `sync-catalog.js`, `sync-data.js`, `fix-catalog.js`: scripts de sincronización y corrección del catálogo.
- `server-manager.js`: utilidades para manejar procesos de servidor.

## Estructura de carpetas relevante

- `back/src/controllers` — controladores (Auto, Reserva, Usuario)
- `back/src/models` — modelos Mongoose (Auto, Reserva, Usuario)
- `back/src/routes` — rutas de la API
- `front/files` — app Next.js (páginas, componentes, public/data con JSON de ejemplo)

## Cómo contribuir

- Abre una rama por feature o fix: `git checkout -b feat/nombre` o `fix/descripcion`.
- Añade tests si modificas lógica importante.
- Sigue el formato de commits y abre un Pull Request hacia `main`.

## Notas adicionales

- Mantén archivos sensibles fuera del repo: `.env` no debe subirse (hay `.gitignore` en `front/files`).
- Si necesitas cargar datos de ejemplo, revisa `rentacar/front/files/public/data/autos.json` y `reservas.json`.

---
