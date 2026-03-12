# 🚀 INICIO RÁPIDO - Despliegue en GCP (30 minutos)

## ⚡ Opción Más Rápida

### 1. Ejecutar verificación automática (2 min)
```powershell
.\pre-deploy-check.ps1
```

### 2. Ejecutar despliegue automatizado (25 min)
```powershell
.\deploy-gcp.ps1
```

**¡Eso es todo!** El script te guiará paso a paso.

---

## 📝 O sigue estos pasos manualmente:

### Paso 1: Preparación (5 min)

1. **Instalar Google Cloud CLI:**
   - Ve a: https://cloud.google.com/sdk/docs/install
   - Descarga e instala
   - Reinicia PowerShell

2. **Iniciar sesión:**
   ```powershell
   gcloud init
   ```

3. **Crear proyecto en GCP:**
   - Ve a: https://console.cloud.google.com
   - Crea un proyecto llamado `rentacar-proyecto`
   - Habilita facturación

### Paso 2: Configurar MongoDB (3 min)

1. **Ir a MongoDB Atlas:** https://cloud.mongodb.com

2. **Configurar acceso a red:**
   - Network Access → Add IP Address
   - Allow Access from Anywhere: `0.0.0.0/0`

3. **Copiar tu connection string:**
   - Connect → Drivers
   - Copia el URI completo

### Paso 3: Desplegar Backend (10 min)

```powershell
# Navegar al backend
cd rentacar\back

# Editar app.yaml y agregar tu MONGODB_URI
# (O agregarlo luego desde la consola de GCP)

# Desplegar
gcloud app deploy

# Responde: Y (Yes)
```

Espera 5-8 minutos... ☕

Al terminar, te dará una URL como:
```
https://rentacar-proyecto.uc.r.appspot.com
```

### Paso 4: Desplegar Frontend en Vercel (5 min)

```powershell
# Navegar al frontend
cd ..\front\files

# Crear .env.production con la URL del backend
"NEXT_PUBLIC_API_URL=https://rentacar-proyecto.uc.r.appspot.com" | Out-File -FilePath .env.production

# Instalar Vercel CLI
npm install -g vercel

# Desplegar
vercel --prod
```

Sigue las instrucciones en pantalla:
- ¿Configurar y desplegar? → **Y**
- ¿Qué scope? → **tu-usuario**
- ¿Link a proyecto existente? → **N**
- ¿Nombre del proyecto? → **rentacar**
- ¿En qué directorio está tu código? → **.** (punto)
- ¿Detectar configuración automáticamente? → **Y**
- ¿Sobrescribir configuración? → **N**

**¡Listo!** Te dará una URL como: `https://rentacar.vercel.app`

---

## ✅ Verificar que funciona

1. **Abre el frontend en tu navegador**
2. **Prueba:**
   - Registro de usuario
   - Login
   - Ver catálogo de autos
   - Crear una reserva

---

## 🆘 Solución Rápida de Problemas

### ❌ Error: "gcloud no se reconoce como comando"
**Solución:** Reinicia PowerShell después de instalar gcloud CLI

### ❌ Error: "Cannot connect to MongoDB"
**Solución:** 
```powershell
# 1. Ve a MongoDB Atlas
# 2. Network Access → Add IP: 0.0.0.0/0
# 3. Espera 2-3 minutos
# 4. Intenta de nuevo
```

### ❌ Error: "CORS blocked"
**Solución:** El backend ya tiene CORS configurado para '*'. Si aún tienes problemas:
```powershell
# Redesplegar backend
cd rentacar\back
gcloud app deploy
```

### ❌ El frontend no se conecta al backend
**Solución:**
```powershell
# Verificar .env.production
cd rentacar\front\files
Get-Content .env.production

# Debe mostrar:
# NEXT_PUBLIC_API_URL=https://tu-backend.appspot.com

# Si está mal, corregir y redesplegar:
vercel --prod
```

---

## 📊 Comandos Útiles

```powershell
# Ver logs del backend
gcloud app logs tail -s default

# Abrir aplicación en el navegador
gcloud app browse

# Ver versiones desplegadas
gcloud app versions list

# Cambiar de proyecto
gcloud config set project otro-proyecto
```

---

## 💰 Costos

- **GCP Free Tier:** $300 de crédito gratis
- **Vercel Free:** Ilimitado para proyectos personales
- **MongoDB Atlas:** Gratis hasta 512 MB

**Para tu proyecto académico: $0 💰**

---

## 📸 Capturas para tu presentación

Captura pantalla de:
1. ✅ Comando `gcloud app deploy` ejecutándose
2. ✅ URL del backend desplegado
3. ✅ URL del frontend desplegado
4. ✅ Aplicación funcionando (login, catálogo, reservas)
5. ✅ Google Cloud Console mostrando tu app
6. ✅ Logs en tiempo real

---

## ⏱️ Timeline

- **0-5 min:** Instalación y configuración de gcloud
- **5-8 min:** Configurar MongoDB Atlas
- **8-18 min:** Desplegar backend
- **18-23 min:** Desplegar frontend
- **23-30 min:** Pruebas y verificación

**Total: 30 minutos** ✅

---

## 🎯 Checklist Final

- [ ] Google Cloud CLI instalado
- [ ] Proyecto GCP creado
- [ ] MongoDB Atlas configurado (Network Access: 0.0.0.0/0)
- [ ] Backend desplegado en App Engine
- [ ] URL del backend copiada
- [ ] .env.production creado
- [ ] Frontend desplegado en Vercel
- [ ] Aplicación funcionando correctamente
- [ ] Capturas de pantalla tomadas

---

## 📞 Ayuda Adicional

Si algo no funciona:

1. **Ejecuta el diagnóstico:**
   ```powershell
   .\pre-deploy-check.ps1
   ```

2. **Lee la guía completa:**
   - Ver: `GUIA_DESPLIEGUE_GCP.md`

3. **Revisa los logs:**
   ```powershell
   gcloud app logs tail -s default
   ```

---

## 🎉 ¡Éxito!

Una vez desplegado:
- ✅ Tu aplicación estará disponible 24/7
- ✅ Escalará automáticamente
- ✅ Tendrás URLs públicas para compartir
- ✅ ¡Conseguirás esa nota! 🎓

**¡Mucha suerte!** 🚀
