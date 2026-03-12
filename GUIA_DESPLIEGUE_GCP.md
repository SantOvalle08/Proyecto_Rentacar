# 🚀 Guía de Despliegue en Google Cloud Platform (GCP)

## ⏱️ Tiempo estimado: 1-2 horas

Esta guía te permitirá desplegar tu aplicación RentaCar en Google Cloud Platform de forma rápida y sencilla.

---

## 📋 Prerrequisitos

1. **Cuenta de Google Cloud** (puedes usar el tier gratuito con $300 de crédito)
2. **MongoDB Atlas** configurado (ya lo tienes)
3. **Git** instalado
4. **Node.js** instalado (v18 o superior)

---

## 🎯 Opción 1: DESPLIEGUE RÁPIDO CON APP ENGINE (Recomendado - 45 min)

Esta es la opción más simple y rápida. Ideal para tu caso.

### Paso 1: Configurar Google Cloud (10 min)

1. **Ir a [Google Cloud Console](https://console.cloud.google.com/)**

2. **Crear un nuevo proyecto:**
   - Click en "Select a Project" → "New Project"
   - Nombre: `rentacar-proyecto`
   - Click "Create"

3. **Habilitar facturación:**
   - Ve a "Billing" en el menú
   - Vincula una tarjeta (no te cobrarán si usas tier gratuito)

4. **Instalar Google Cloud CLI:**
   ```powershell
   # Descargar desde: https://cloud.google.com/sdk/docs/install
   # O usar este comando:
   (New-Object Net.WebClient).DownloadFile("https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe", "$env:Temp\GoogleCloudSDKInstaller.exe")
   & $env:Temp\GoogleCloudSDKInstaller.exe
   ```

5. **Iniciar sesión en gcloud:**
   ```powershell
   gcloud init
   ```
   - Selecciona tu cuenta de Google
   - Selecciona el proyecto `rentacar-proyecto`
   - Selecciona una región (recomendado: `us-central1` o `southamerica-east1`)

### Paso 2: Configurar Variables de Entorno (5 min)

1. **Crear archivo .env en el backend** (si no existe):
   ```powershell
   cd rentacar/back
   ```

2. **Editar el archivo `.env`** con tus datos de MongoDB Atlas:
   ```env
   MONGODB_URI=mongodb+srv://tu-usuario:tu-password@cluster.mongodb.net/rentacar?retryWrites=true&w=majority
   PORT=8080
   NODE_ENV=production
   JWT_SECRET=tu-secreto-jwt-muy-seguro
   ```

### Paso 3: Desplegar el Backend (15 min)

```powershell
# Navegar al directorio del backend
cd c:\Users\santi\OneDrive\Desktop\Proyectos\GitHub\Proyecto_Rentacar\rentacar\back

# Asegurar que app.yaml tenga las variables correctas
# (Editar app.yaml si es necesario)

# Desplegar a App Engine
gcloud app deploy

# Cuando pregunte:
# - Service: default
# - Region: us-central1 (o tu región preferida)
# - Continue?: Y
```

**Espera 5-10 minutos mientras se despliega...**

Al finalizar, te dará una URL como: `https://rentacar-proyecto.uc.r.appspot.com`

### Paso 4: Desplegar el Frontend (15 min)

1. **Configurar la URL del backend en el frontend:**
   ```powershell
   cd ..\front\files
   ```

2. **Crear archivo `.env.production`:**
   ```env
   NEXT_PUBLIC_API_URL=https://rentacar-proyecto.uc.r.appspot.com
   ```

3. **Opción A: Desplegar en Vercel (MÁS RÁPIDO - 5 min):**
   ```powershell
   # Instalar Vercel CLI
   npm install -g vercel

   # Desplegar
   vercel --prod
   ```
   - Sigue las instrucciones
   - Confirma el directorio actual
   - Configura como proyecto Next.js
   - ¡Listo!

4. **Opción B: Desplegar en Cloud Run (15 min):**
   ```powershell
   # Construir y desplegar con Cloud Build
   gcloud run deploy rentacar-frontend `
     --source . `
     --platform managed `
     --region us-central1 `
     --allow-unauthenticated
   ```

---

## 🎯 Opción 2: DESPLIEGUE CON CLOUD RUN (Intermedio - 1.5 horas)

### Backend en Cloud Run

```powershell
cd c:\Users\santi\OneDrive\Desktop\Proyectos\GitHub\Proyecto_Rentacar\rentacar\back

# Construir la imagen
gcloud builds submit --tag gcr.io/rentacar-proyecto/backend

# Desplegar
gcloud run deploy rentacar-backend `
  --image gcr.io/rentacar-proyecto/backend `
  --platform managed `
  --region us-central1 `
  --allow-unauthenticated `
  --set-env-vars MONGODB_URI="tu-mongodb-uri",NODE_ENV=production
```

### Frontend en Cloud Run

```powershell
cd ..\front\files

# Actualizar la URL del backend en .env.production
# NEXT_PUBLIC_API_URL=https://rentacar-backend-xxxxxxxxx-uc.a.run.app

# Construir la imagen
gcloud builds submit --tag gcr.io/rentacar-proyecto/frontend

# Desplegar
gcloud run deploy rentacar-frontend `
  --image gcr.io/rentacar-proyecto/frontend `
  --platform managed `
  --region us-central1 `
  --allow-unauthenticated
```

---

## 🔧 Configuración Adicional

### Configurar CORS en el Backend

Asegúrate de que tu backend permita requests desde el dominio del frontend:

En `rentacar/back/src/middleware/cors.js`, agrega tu dominio de producción:

```javascript
const allowedOrigins = [
  'http://localhost:3000',
  'https://tu-frontend.vercel.app',
  'https://rentacar-frontend-xxxxxxxxx-uc.a.run.app'
];
```

### Variables de Entorno en App Engine

Para agregar/actualizar variables de entorno sin redesplegar:

```powershell
gcloud app deploy --set-env-vars MONGODB_URI="nueva-uri",JWT_SECRET="nuevo-secreto"
```

---

## 🧪 Verificar el Despliegue

1. **Verificar el backend:**
   ```powershell
   curl https://tu-backend-url/api/autos
   ```

2. **Verificar el frontend:**
   - Abre el navegador en la URL del frontend
   - Prueba login, registro, y funcionalidades principales

---

## 📊 Monitoreo

1. **Ver logs del backend:**
   ```powershell
   gcloud app logs tail -s default
   
   # O para Cloud Run:
   gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=rentacar-backend" --limit 50
   ```

2. **Ver métricas:**
   - Ve a [Cloud Console → Monitoring](https://console.cloud.google.com/monitoring)
   - Revisa CPU, memoria, requests, etc.

---

## 💰 Costos Estimados

- **Tier Gratuito de GCP:** $300 de crédito para nuevos usuarios
- **App Engine:** ~$50-60/mes (con tier gratuito incluye primeros 28 hrs instancia gratis)
- **Cloud Run:** ~$5-10/mes (solo pagas por uso)
- **MongoDB Atlas:** Gratis hasta 512 MB

**Para tu proyecto académico, con el tier gratuito no pagarás nada.**

---

## 🚨 Solución de Problemas

### Error: "No se puede conectar a MongoDB"
```powershell
# Verificar que MongoDB Atlas permita conexiones desde cualquier IP
# En Atlas → Network Access → Add IP Address → Allow Access from Anywhere (0.0.0.0/0)
```

### Error: "CORS policy blocked"
```powershell
# Actualizar CORS en el backend para incluir tu dominio de frontend
```

### Error: "Port already in use"
```powershell
# En App Engine y Cloud Run, usar la variable de entorno PORT:
# const PORT = process.env.PORT || 8080;
```

### Ver errores en tiempo real:
```powershell
gcloud app logs tail -s default
```

---

## ✅ Checklist Final

- [ ] Cuenta de Google Cloud creada
- [ ] Proyecto GCP configurado
- [ ] MongoDB Atlas configurado y accesible
- [ ] Google Cloud CLI instalado y autenticado
- [ ] Variables de entorno configuradas
- [ ] Backend desplegado y funcionando
- [ ] Frontend desplegado y funcionando
- [ ] CORS configurado correctamente
- [ ] Aplicación probada end-to-end

---

## 🎓 Tips para tu Presentación

1. **Documenta todo con capturas de pantalla** mientras despliegas
2. **Guarda las URLs** de tu aplicación desplegada
3. **Prueba todas las funcionalidades** antes de presentar
4. **Ten un backup plan:** Si algo falla, muestra la aplicación en local

---

## 📞 Comandos Útiles

```powershell
# Ver servicios desplegados
gcloud app services list

# Ver versiones
gcloud app versions list

# Abrir la aplicación en el navegador
gcloud app browse

# Ver configuración actual
gcloud config list

# Cambiar proyecto
gcloud config set project rentacar-proyecto

# Ver costos actuales
gcloud billing accounts list
```

---

## 🚀 Despliegue Express (30 minutos)

Si tienes prisa, sigue estos pasos mínimos:

```powershell
# 1. Instalar gcloud CLI (si no lo tienes)
# 2. Iniciar sesión
gcloud init

# 3. Desplegar backend
cd rentacar\back
gcloud app deploy

# 4. Desplegar frontend en Vercel
cd ..\front\files
npm install -g vercel
vercel --prod
```

**¡Listo en 30 minutos!**

---

## 📚 Recursos Adicionales

- [Documentación de App Engine](https://cloud.google.com/appengine/docs)
- [Documentación de Cloud Run](https://cloud.google.com/run/docs)
- [Tier Gratuito de GCP](https://cloud.google.com/free)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

---

## 🎉 ¡Éxito!

Si sigues esta guía paso a paso, habrás desplegado tu aplicación en menos de 2 horas. 

**Buena suerte con tu nota! 🎓**
