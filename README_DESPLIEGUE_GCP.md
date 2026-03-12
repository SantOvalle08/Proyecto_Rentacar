# 🚀 Despliegue RentaCar en Google Cloud Platform

## 📚 Documentación Completa para Despliegue en GCP

Este conjunto de archivos te permitirá desplegar tu aplicación RentaCar en Google Cloud Platform de forma rápida y eficiente.

---

## 📖 Guías Disponibles

### 1. 🏃 [INICIO RÁPIDO](INICIO_RAPIDO_GCP.md) - **EMPIEZA AQUÍ**
**⏱️ 30 minutos | Dificultad: Fácil**
- Pasos mínimos para desplegar
- Comandos esenciales
- Solución rápida de problemas
- **Ideal si tienes prisa**

### 2. 📋 [GUÍA COMPLETA](GUIA_DESPLIEGUE_GCP.md)
**⏱️ 1-2 horas | Dificultad: Media**
- Explicación detallada de cada paso
- Múltiples opciones de despliegue
- Configuración avanzada
- Monitoreo y optimización
- **Ideal para entender todo el proceso**

### 3. 🎤 [TIPS PARA PRESENTACIÓN](TIPS_PRESENTACION_GCP.md)
**⏱️ 15 minutos lectura | Esencial**
- Script de presentación
- Puntos clave a destacar
- Preguntas frecuentes y respuestas
- Capturas de pantalla necesarias
- **Ideal para preparar tu exposición**

---

## 🛠️ Scripts Automatizados

### 1. `pre-deploy-check.ps1` - Verificación Pre-Despliegue
Verifica que tengas todo listo antes de desplegar.

```powershell
.\pre-deploy-check.ps1
```

**Verifica:**
- ✅ Node.js instalado
- ✅ Google Cloud CLI instalado y autenticado
- ✅ Archivos de configuración presentes
- ✅ Variables de entorno configuradas
- ✅ Dependencias instaladas

### 2. `deploy-gcp.ps1` - Despliegue Automatizado
Despliega automáticamente backend y frontend.

```powershell
.\deploy-gcp.ps1
```

**Hace:**
- 🚀 Despliega backend en App Engine o Cloud Run
- 🚀 Despliega frontend en Vercel o Cloud Run
- 🚀 Configura variables de entorno
- 🚀 Muestra URLs de acceso

---

## 📁 Archivos de Configuración Creados

### Backend (`rentacar/back/`)
- ✅ `Dockerfile` - Para despliegue en Cloud Run
- ✅ `app.yaml` - Para despliegue en App Engine (más simple)
- ✅ `.dockerignore` - Optimiza build de Docker
- ✅ `.gcloudignore` - Optimiza despliegue en GCP
- ✅ `.env.example` - Plantilla de variables de entorno

### Frontend (`rentacar/front/files/`)
- ✅ `Dockerfile` - Para despliegue en Cloud Run
- ✅ `.dockerignore` - Optimiza build de Docker
- ✅ `next.config.mjs` - Actualizado con `output: standalone`

---

## 🎯 Opciones de Despliegue

### Opción 1: RÁPIDA (Recomendada - 30 min) ⭐
```
Backend:  App Engine
Frontend: Vercel
Database: MongoDB Atlas
```
**Ventajas:**
- ✅ Más simple
- ✅ Más rápido
- ✅ Mejor documentado
- ✅ Free tier generoso

### Opción 2: FLEXIBLE (45 min)
```
Backend:  Cloud Run
Frontend: Cloud Run
Database: MongoDB Atlas
```
**Ventajas:**
- ✅ Más control
- ✅ Contenedores Docker
- ✅ Mejor para microservicios
- ✅ Portabilidad

---

## ⚡ Inicio Rápido de 3 Pasos

### 1️⃣ Verificar Requisitos
```powershell
.\pre-deploy-check.ps1
```

### 2️⃣ Desplegar
```powershell
.\deploy-gcp.ps1
```

### 3️⃣ ¡Probar!
Abre las URLs que te proporciona el script y prueba tu aplicación.

---

## 📊 Arquitectura de la Solución

```
┌─────────────────────────────────────────────┐
│              USUARIOS                        │
└───────────────┬─────────────────────────────┘
                │
                ↓
┌───────────────────────────────────────────────┐
│         FRONTEND (Next.js 15)                 │
│   ┌─────────────────────────────────┐         │
│   │  Vercel / Cloud Run             │         │
│   │  - SSR/SSG                      │         │
│   │  - CDN Global                   │         │
│   │  - Edge Functions               │         │
│   └─────────────────────────────────┘         │
└───────────────┬───────────────────────────────┘
                │ HTTPS/API Calls
                ↓
┌───────────────────────────────────────────────┐
│         BACKEND (Express.js)                  │
│   ┌─────────────────────────────────┐         │
│   │  App Engine / Cloud Run         │         │
│   │  - RESTful API                  │         │
│   │  - JWT Auth                     │         │
│   │  - Auto-scaling                 │         │
│   └─────────────────────────────────┘         │
└───────────────┬───────────────────────────────┘
                │ MongoDB Driver
                ↓
┌───────────────────────────────────────────────┐
│         DATABASE (MongoDB)                    │
│   ┌─────────────────────────────────┐         │
│   │  MongoDB Atlas                  │         │
│   │  - Multi-region                 │         │
│   │  - Auto-backup                  │         │
│   │  - High Availability            │         │
│   └─────────────────────────────────┘         │
└───────────────────────────────────────────────┘
```

---

## 💰 Estimación de Costos

### Para Proyecto Académico (Free Tier)
| Servicio | Costo Mensual |
|----------|---------------|
| Backend (App Engine) | **$0** |
| Frontend (Vercel) | **$0** |
| Database (MongoDB Atlas) | **$0** |
| **TOTAL** | **$0/mes** ✅ |

### Para Producción
| Servicio | Costo Mensual |
|----------|---------------|
| Backend (App Engine) | ~$40-50 |
| Frontend (Vercel) | $0 |
| Database (MongoDB) | ~$10 |
| **TOTAL** | **~$50-60/mes** |

---

## 🔧 Configuración de Variables de Entorno

### Backend
Crea/edita `rentacar/back/.env`:
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/rentacar
PORT=8080
NODE_ENV=production
JWT_SECRET=tu-secreto-seguro
```

### Frontend
Crea `rentacar/front/files/.env.production`:
```env
NEXT_PUBLIC_API_URL=https://tu-backend-url.appspot.com
```

---

## 🧪 Verificar Despliegue

### Backend
```powershell
# Comando
curl https://tu-backend-url/api/autos

# Esperado
{
  "success": true,
  "data": [...]
}
```

### Frontend
1. Abre la URL en el navegador
2. Prueba registro de usuario
3. Prueba login
4. Navega por el catálogo
5. Crea una reserva

---

## 📝 Comandos Útiles de GCP

```powershell
# Ver logs en tiempo real
gcloud app logs tail -s default

# Abrir app en navegador
gcloud app browse

# Ver versiones desplegadas
gcloud app versions list

# Ver servicios activos
gcloud app services list

# Cambiar de proyecto
gcloud config set project mi-proyecto

# Ver configuración actual
gcloud config list

# Redesplegar
cd rentacar\back
gcloud app deploy
```

---

## 🆘 Solución de Problemas Comunes

### ❌ "gcloud no se reconoce como comando"
```powershell
# Instalar Google Cloud CLI
# https://cloud.google.com/sdk/docs/install
# Luego reiniciar PowerShell
```

### ❌ "Cannot connect to MongoDB"
```powershell
# 1. Ve a MongoDB Atlas → Network Access
# 2. Add IP Address: 0.0.0.0/0 (Allow from anywhere)
# 3. Espera 2-3 minutos para que se aplique
```

### ❌ "CORS policy blocked"
```powershell
# El backend ya tiene CORS configurado
# Verifica que .env.production tenga la URL correcta del backend
```

### ❌ "Build failed"
```powershell
# Verifica que las dependencias estén instaladas
cd rentacar\back
npm install

cd ..\front\files
npm install
```

---

## 📚 Recursos Adicionales

- 📖 [Documentación de Google App Engine](https://cloud.google.com/appengine/docs)
- 📖 [Documentación de Cloud Run](https://cloud.google.com/run/docs)
- 📖 [Documentación de MongoDB Atlas](https://docs.atlas.mongodb.com/)
- 📖 [Documentación de Vercel](https://vercel.com/docs)
- 📖 [Free Tier de GCP](https://cloud.google.com/free)

---

## ✅ Checklist Completo

### Antes de Empezar
- [ ] Cuenta de Google Cloud creada
- [ ] MongoDB Atlas configurado
- [ ] Git instalado
- [ ] Node.js instalado (v18+)

### Durante el Despliegue
- [ ] Google Cloud CLI instalado
- [ ] Autenticado en gcloud (`gcloud init`)
- [ ] Proyecto GCP creado
- [ ] Variables de entorno configuradas
- [ ] Backend desplegado
- [ ] Frontend desplegado

### Después del Despliegue
- [ ] Aplicación funcionando
- [ ] URLs guardadas
- [ ] Capturas de pantalla tomadas
- [ ] Pruebas end-to-end completadas
- [ ] Preparación para presentación

---

## 🎓 Para tu Presentación

1. **Lee:** [TIPS_PRESENTACION_GCP.md](TIPS_PRESENTACION_GCP.md)
2. **Captura pantallas de:**
   - Comando de despliegue
   - GCP Console con la app
   - MongoDB Atlas conectado
   - Aplicación funcionando
   - Logs en tiempo real
3. **Prepara respuestas para:**
   - ¿Por qué GCP y no Azure?
   - ¿Cuánto costará en producción?
   - ¿Es escalable?
   - ¿Es seguro?

---

## 🎉 ¡Éxito!

Si has llegado hasta aquí y seguido las guías, **tu aplicación debería estar desplegada y funcionando en la nube**.

**Tiempo total estimado:** 30 minutos - 2 horas (dependiendo de la opción)

### Próximos pasos:
1. ✅ Verifica que todo funciona
2. ✅ Toma capturas de pantalla
3. ✅ Prepara tu presentación
4. ✅ ¡Consigue esa nota! 🎓

---

## 📞 ¿Necesitas Ayuda?

Si algo no funciona:

1. **Ejecuta el diagnóstico:**
   ```powershell
   .\pre-deploy-check.ps1
   ```

2. **Lee la sección de troubleshooting** en:
   - `INICIO_RAPIDO_GCP.md`
   - `GUIA_DESPLIEGUE_GCP.md`

3. **Revisa los logs:**
   ```powershell
   gcloud app logs tail -s default
   ```

4. **Consulta la documentación oficial** de GCP

---

## 📊 Estadísticas del Proyecto

- **Archivos de configuración creados:** 10+
- **Líneas de documentación:** 1000+
- **Scripts automatizados:** 2
- **Guías completas:** 3
- **Tiempo de despliegue:** < 2 horas ✅

---

**¡Buena suerte con tu proyecto y presentación!** 🚀

*Creado con ❤️ para ayudarte a conseguir esa nota*
