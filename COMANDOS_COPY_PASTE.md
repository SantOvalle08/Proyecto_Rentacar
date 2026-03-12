# ⚡ Comandos Copy-Paste para Despliegue Rápido

Este archivo contiene todos los comandos listos para copiar y pegar.
**Solo reemplaza los valores entre < > con tus datos.**

---

## 🚀 DESPLIEGUE EXPRESS (30 min)

### 1. Verificar Requisitos (2 min)
```powershell
# Verificar Node.js
node --version

# Verificar npm
npm --version

# Verificar si gcloud está instalado
gcloud version
```

---

### 2. Configurar Google Cloud CLI (5 min)

```powershell
# Si NO tienes gcloud instalado, descarga desde:
# https://cloud.google.com/sdk/docs/install

# Inicializar y autenticar
gcloud init

# Configurar proyecto (reemplaza <TU-PROYECTO-ID> con tu ID)
gcloud config set project <TU-PROYECTO-ID>

# Ejemplo:
# gcloud config set project rentacar-proyecto
```

---

### 3. Configurar MongoDB Atlas (3 min)

```powershell
# 1. Ve a: https://cloud.mongodb.com
# 2. Login/Registro
# 3. Create Free Cluster
# 4. Network Access → Add IP: 0.0.0.0/0
# 5. Database Access → Crear usuario
# 6. Connect → Drivers → Copiar connection string
```

---

### 4. Crear archivo .env en Backend (2 min)

```powershell
# Navegar al backend
cd c:\Users\santi\OneDrive\Desktop\Proyectos\GitHub\Proyecto_Rentacar\rentacar\back

# Crear archivo .env (REEMPLAZA con tus valores)
@"
MONGODB_URI=mongodb+srv://<usuario>:<password>@<cluster>.mongodb.net/rentacar?retryWrites=true&w=majority
PORT=8080
NODE_ENV=production
JWT_SECRET=<tu-secreto-jwt-super-seguro-12345>
"@ | Out-File -FilePath .env -Encoding utf8

# Ejemplo:
# MONGODB_URI=mongodb+srv://admin:MiPassword123@cluster0.xxxxx.mongodb.net/rentacar?retryWrites=true&w=majority
```

---

### 5. Desplegar Backend en App Engine (10 min)

```powershell
# Ya debes estar en: rentacar\back

# Verificar que app.yaml existe
Test-Path app.yaml

# IMPORTANTE: Editar app.yaml y agregar MONGODB_URI
# O agregarlo aquí directamente (REEMPLAZA con tu URI):

# Desplegar
gcloud app deploy --quiet

# Responde: Y cuando pregunte

# Al finalizar, ver la URL:
gcloud app browse
# Guarda esta URL, la necesitarás para el frontend
```

---

### 6. Desplegar Frontend en Vercel (8 min)

```powershell
# Navegar al frontend
cd ..\front\files

# Crear .env.production (REEMPLAZA <BACKEND-URL> con la URL de tu backend)
@"
NEXT_PUBLIC_API_URL=<BACKEND-URL>
"@ | Out-File -FilePath .env.production -Encoding utf8

# Ejemplo:
# NEXT_PUBLIC_API_URL=https://rentacar-proyecto.uc.r.appspot.com

# Instalar Vercel CLI globalmente
npm install -g vercel

# Desplegar
vercel --prod

# Sigue las instrucciones:
# - Setup and deploy? Y
# - Which scope? [tu-usuario]
# - Link to existing project? N
# - Project name? rentacar
# - In which directory? .
# - Want to modify settings? N
```

---

## ✅ VERIFICAR DESPLIEGUE

```powershell
# Ver logs del backend
gcloud app logs tail -s default

# Abrir backend en navegador
gcloud app browse

# Ver todas las versiones
gcloud app versions list
```

---

## 🔄 COMANDOS DE REDESPLIEGUE

### Redesplegar solo Backend
```powershell
cd c:\Users\santi\OneDrive\Desktop\Proyectos\GitHub\Proyecto_Rentacar\rentacar\back
gcloud app deploy --quiet
```

### Redesplegar solo Frontend
```powershell
cd c:\Users\santi\OneDrive\Desktop\Proyectos\GitHub\Proyecto_Rentacar\rentacar\front\files
vercel --prod
```

---

## 🛠️ COMANDOS DE UTILIDAD

### Ver información del proyecto
```powershell
gcloud config list
gcloud app describe
gcloud app services list
```

### Ver logs en tiempo real
```powershell
# Logs del backend
gcloud app logs tail -s default

# Últimas 100 líneas
gcloud app logs read --limit=100
```

### Ver uso y costos
```powershell
gcloud app instances list
gcloud billing accounts list
```

---

## 🧪 COMANDOS DE PRUEBA

### Probar Backend
```powershell
# Reemplaza <BACKEND-URL> con tu URL
curl <BACKEND-URL>/
curl <BACKEND-URL>/api/autos

# Ejemplo:
# curl https://rentacar-proyecto.uc.r.appspot.com/api/autos
```

### Probar Frontend
```powershell
# Solo abre en el navegador la URL que te dio Vercel
# Ejemplo: https://rentacar.vercel.app
```

---

## 📊 MONITOREO

### Ver métricas en la consola
```powershell
# Abrir GCP Console
start https://console.cloud.google.com/appengine

# Abrir Monitoring
start https://console.cloud.google.com/monitoring

# Abrir Logs
start https://console.cloud.google.com/logs
```

### Ver estado de MongoDB
```powershell
# Abrir MongoDB Atlas
start https://cloud.mongodb.com
```

---

## 🔧 ACTUALIZAR VARIABLES DE ENTORNO

### Actualizar variables en App Engine (sin redesplegar)
```powershell
cd rentacar\back

# Actualizar MONGODB_URI
gcloud app deploy --set-env-vars MONGODB_URI="<nueva-uri>"

# Actualizar múltiples variables
gcloud app deploy --set-env-vars MONGODB_URI="<uri>",JWT_SECRET="<secret>",NODE_ENV="production"
```

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### Backend no se conecta a MongoDB
```powershell
# Verificar que Network Access esté configurado
# 1. Ve a MongoDB Atlas
# 2. Network Access → Add IP Address → 0.0.0.0/0
# 3. Espera 2-3 minutos

# Ver logs de error
gcloud app logs tail -s default
```

### CORS Error
```powershell
# El backend ya tiene CORS configurado para '*'
# Si aún hay error, verifica .env.production del frontend

cd rentacar\front\files
Get-Content .env.production

# Debe mostrar la URL correcta del backend
```

### Error de autenticación gcloud
```powershell
# Volver a autenticar
gcloud auth login

# Verificar cuenta activa
gcloud auth list

# Configurar cuenta por defecto
gcloud config set account <tu-email@gmail.com>
```

### Ver todos los errores recientes
```powershell
gcloud app logs read --limit=50 --severity=ERROR
```

---

## 🔄 ROLLBACK (Volver a versión anterior)

```powershell
# Ver versiones disponibles
gcloud app versions list

# Cambiar tráfico a versión anterior
gcloud app versions migrate <VERSION-ID>

# Ejemplo:
# gcloud app versions migrate 20240311t123456
```

---

## 🧹 LIMPIEZA

### Detener versión antigua
```powershell
# Listar versiones
gcloud app versions list

# Detener versión (no sirve más tráfico, pero no se borra)
gcloud app versions stop <VERSION-ID>

# Eliminar versión antigua
gcloud app versions delete <VERSION-ID>
```

---

## 📦 SCRIPTS AUTOMATIZADOS

### Usar script de verificación
```powershell
cd c:\Users\santi\OneDrive\Desktop\Proyectos\GitHub\Proyecto_Rentacar
.\pre-deploy-check.ps1
```

### Usar script de despliegue automatizado
```powershell
cd c:\Users\santi\OneDrive\Desktop\Proyectos\GitHub\Proyecto_Rentacar
.\deploy-gcp.ps1
```

---

## 🎯 COMANDOS PARA PRESENTACIÓN

### Abrir todas las consolas relevantes
```powershell
# GCP App Engine
start https://console.cloud.google.com/appengine

# GCP Monitoring
start https://console.cloud.google.com/monitoring

# MongoDB Atlas
start https://cloud.mongodb.com

# Tu aplicación frontend
start <TU-URL-DE-VERCEL>

# Tu aplicación backend
start <TU-URL-DE-APPSPOT>
```

### Ver logs en vivo durante la demo
```powershell
gcloud app logs tail -s default
```

---

## 💾 BACKUP DE CONFIGURACIÓN

### Exportar configuración actual
```powershell
# Ver variables de entorno
gcloud app describe --format=yaml > app-config-backup.yaml

# Ver versiones
gcloud app versions list --format=json > versions-backup.json
```

---

## 🌐 DOMINIOS PERSONALIZADOS (Opcional)

### Si quieres usar tu propio dominio
```powershell
# Verificar dominio
gcloud app domain-mappings create <tu-dominio.com>

# Ver dominios mapeados
gcloud app domain-mappings list
```

---

## 📈 ESCALAMIENTO

### Ajustar escalamiento automático
```powershell
# Editar app.yaml y cambiar:
# min_instances: 1
# max_instances: 10

# Luego redesplegar
cd rentacar\back
gcloud app deploy --quiet
```

---

## ✅ COMANDOS DE VALIDACIÓN FINAL

```powershell
# 1. Backend funcionando
curl <BACKEND-URL>/api/autos

# 2. Frontend accesible
start <FRONTEND-URL>

# 3. MongoDB conectado (ver logs)
gcloud app logs tail -s default

# 4. Sin errores recientes
gcloud app logs read --limit=20 --severity=ERROR

# Si todo OK, ¡estás listo! 🎉
```

---

## 🎓 COMANDOS PARA TU REPORTE

### Generar reporte de despliegue
```powershell
# Información del proyecto
gcloud config list > reporte-despliegue.txt

# Información de la app
gcloud app describe >> reporte-despliegue.txt

# Versiones actuales
gcloud app versions list >> reporte-despliegue.txt

# Últimos logs
gcloud app logs read --limit=50 >> reporte-despliegue.txt

# Ver el reporte
Get-Content reporte-despliegue.txt
```

---

## 🚀 ¡TODO LISTO!

**Has desplegado exitosamente tu aplicación en GCP** 🎉

URLs para compartir:
- Frontend: `https://tu-app.vercel.app`
- Backend: `https://tu-proyecto.appspot.com`
- Docs completas: Ver `README_DESPLIEGUE_GCP.md`

**¡Buena suerte con tu nota!** 🎓
