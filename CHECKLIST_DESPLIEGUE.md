# ✅ CHECKLIST DE DESPLIEGUE - IMPRÍMELO

Marca cada casilla cuando completes el paso. ¡No te saltes ninguno!

---

## 📋 ANTES DE EMPEZAR (15 min)

- [ ] **Cuenta de Google Cloud creada**
      → https://console.cloud.google.com

- [ ] **MongoDB Atlas configurado**
      → https://cloud.mongodb.com
      - [ ] Cluster creado (Free Tier)
      - [ ] Usuario de base de datos creado
      - [ ] Network Access: 0.0.0.0/0 agregado
      - [ ] Connection string copiado

- [ ] **Node.js instalado** (v18+)
      → Verificar: `node --version`

- [ ] **npm instalado**
      → Verificar: `npm --version`

- [ ] **Google Cloud CLI instalado**
      → https://cloud.google.com/sdk/docs/install
      → Verificar: `gcloud version`

- [ ] **Proyecto GCP creado**
      Nombre sugerido: `rentacar-proyecto`

- [ ] **Facturación habilitada en GCP**
      (No te cobrarán con Free Tier)

---

## 🔧 CONFIGURACIÓN INICIAL (10 min)

- [ ] **gcloud autenticado**
      ```powershell
      gcloud init
      ```
      - [ ] Cuenta de Google seleccionada
      - [ ] Proyecto seleccionado
      - [ ] Región seleccionada (us-central1 recomendado)

- [ ] **Archivo .env creado en backend**
      Ubicación: `rentacar/back/.env`
      Contenido:
      ```
      MONGODB_URI=mongodb+srv://...
      PORT=8080
      NODE_ENV=production
      JWT_SECRET=...
      ```

- [ ] **Variables verificadas**
      - [ ] MONGODB_URI es correcto
      - [ ] JWT_SECRET es seguro (mínimo 32 caracteres)

---

## 🚀 DESPLIEGUE BACKEND (15 min)

- [ ] **Navegar al directorio backend**
      ```powershell
      cd rentacar\back
      ```

- [ ] **Verificar archivos necesarios presentes**
      - [ ] `package.json` existe
      - [ ] `app.yaml` existe
      - [ ] `.env` existe
      - [ ] `index.js` existe

- [ ] **Opcional: Editar app.yaml con MONGODB_URI**
      (O agregarlo después desde GCP Console)

- [ ] **Desplegar a App Engine**
      ```powershell
      gcloud app deploy
      ```
      - [ ] Confirmar región cuando pregunte
      - [ ] Responder "Y" (Yes) para continuar
      - [ ] Esperar 5-10 minutos ☕

- [ ] **Despliegue completado exitosamente**
      Mensaje: "Deployed service [default] to..."

- [ ] **URL del backend copiada y guardada**
      Ejemplo: `https://rentacar-proyecto.uc.r.appspot.com`
      Mi URL: ___________________________________

- [ ] **Backend verificado funcionando**
      ```powershell
      curl https://tu-url/api/autos
      ```

---

## 🎨 DESPLIEGUE FRONTEND (10 min)

- [ ] **Navegar al directorio frontend**
      ```powershell
      cd ..\front\files
      ```

- [ ] **Crear archivo .env.production**
      Contenido:
      ```
      NEXT_PUBLIC_API_URL=https://tu-backend-url
      ```

- [ ] **Variable NEXT_PUBLIC_API_URL verificada**
      Apunta a la URL correcta del backend

- [ ] **Vercel CLI instalado**
      ```powershell
      npm install -g vercel
      ```

- [ ] **Desplegar a Vercel**
      ```powershell
      vercel --prod
      ```
      - [ ] Setup and deploy? → Y
      - [ ] Which scope? → [tu-usuario]
      - [ ] Link to existing project? → N
      - [ ] Project name? → rentacar
      - [ ] In which directory? → .
      - [ ] Override settings? → N

- [ ] **Despliegue completado exitosamente**
      Mensaje: "Production: https://..."

- [ ] **URL del frontend copiada y guardada**
      Ejemplo: `https://rentacar.vercel.app`
      Mi URL: ___________________________________

---

## ✅ VERIFICACIÓN (10 min)

- [ ] **Frontend abre en el navegador**
      → Sin errores 404 o de carga

- [ ] **Backend responde a peticiones**
      ```powershell
      curl https://tu-backend/api/autos
      ```

- [ ] **Probar funcionalidad completa:**
      - [ ] Registro de nuevo usuario funciona
      - [ ] Login funciona
      - [ ] Catálogo de autos se muestra
      - [ ] Detalle de auto se abre
      - [ ] Crear reserva funciona
      - [ ] Ver perfil funciona
      - [ ] Logout funciona

- [ ] **No hay errores CORS**
      (Verificar en consola del navegador - F12)

- [ ] **Datos se guardan en MongoDB Atlas**
      → Verificar en MongoDB Atlas → Collections

- [ ] **Logs del backend sin errores críticos**
      ```powershell
      gcloud app logs tail -s default
      ```

---

## 📸 DOCUMENTACIÓN (15 min)

- [ ] **Capturas de pantalla tomadas:**
      - [ ] Comando `gcloud app deploy` en ejecución
      - [ ] Mensaje de despliegue exitoso
      - [ ] GCP Console → App Engine Dashboard
      - [ ] GCP Console → Monitoring (gráficas)
      - [ ] MongoDB Atlas → Cluster conectado
      - [ ] MongoDB Atlas → Collections con datos
      - [ ] Vercel Dashboard → Deployment
      - [ ] Frontend funcionando (home)
      - [ ] Catálogo de autos
      - [ ] Formulario de reserva
      - [ ] Perfil de usuario
      - [ ] Logs en tiempo real

- [ ] **URLs guardadas en documento**
      - Backend: _________________________
      - Frontend: ________________________

- [ ] **Credenciales de prueba creadas**
      - Email: __________________________
      - Password: _______________________

---

## 🎤 PREPARACIÓN PRESENTACIÓN (20 min)

- [ ] **Script de presentación preparado**
      → Ver: `TIPS_PRESENTACION_GCP.md`

- [ ] **Respuestas a preguntas frecuentes preparadas:**
      - [ ] ¿Por qué GCP y no Azure?
      - [ ] ¿Cuánto tiempo tomó?
      - [ ] ¿Cuánto cuesta?
      - [ ] ¿Es escalable?
      - [ ] ¿Es seguro?

- [ ] **Demo practicada al menos 2 veces**

- [ ] **Plan B preparado**
      (En caso de que internet falle, tener capturas)

- [ ] **Slides/presentación creada** (si aplica)

- [ ] **Laptop cargada y lista**

---

## 🔄 DÍA DE LA PRESENTACIÓN

- [ ] **30 minutos antes:**
      - [ ] Verificar que frontend funciona
      - [ ] Verificar que backend funciona
      - [ ] Probar login con usuario de prueba
      - [ ] Abrir todas las pestañas necesarias
      - [ ] Tener URLs a mano

- [ ] **15 minutos antes:**
      - [ ] Conectar a WiFi/Internet estable
      - [ ] Cerrar aplicaciones innecesarias
      - [ ] Tener agua a mano
      - [ ] Respirar profundo 😊

- [ ] **Durante la presentación:**
      - [ ] Hablar con confianza
      - [ ] Ir despacio, dejar que cargue
      - [ ] Explicar cada parte de la arquitectura
      - [ ] Mostrar capturas si algo falla
      - [ ] Sonreír 😊

---

## 📊 MÉTRICAS PARA REPORTAR

- [ ] **Tiempo total de despliegue:** _____ minutos

- [ ] **Costo estimado mensual:** $0 (Free Tier)

- [ ] **Disponibilidad:** _____% (ver en GCP Monitoring)

- [ ] **Tiempo de respuesta promedio:** _____ ms

- [ ] **Usuarios concurrentes soportados:** 1000+

- [ ] **Región de despliegue:** _______________

- [ ] **Tecnologías usadas:**
      - [ ] Frontend: Next.js 15 + React 19
      - [ ] Backend: Node.js + Express
      - [ ] Database: MongoDB Atlas
      - [ ] Hosting Backend: Google App Engine
      - [ ] Hosting Frontend: Vercel

---

## 🎯 OPCIONAL AVANZADO

- [ ] **Dominio personalizado configurado**

- [ ] **SSL/HTTPS verificado** (ya incluido)

- [ ] **Monitoreo y alertas configurados**

- [ ] **CI/CD configurado** (despliegue automático)

- [ ] **Logs centralizados** configurados

- [ ] **Backup automático** de MongoDB verificado

---

## 🆘 EN CASO DE PROBLEMAS

### Si el backend no se despliega:
- [ ] Verificar que app.yaml sea válido
- [ ] Verificar que package.json sea válido
- [ ] Ver logs: `gcloud app logs tail`
- [ ] Verificar que proyecto GCP tenga facturación

### Si el frontend no se despliega:
- [ ] Verificar que next.config.mjs tenga `output: 'standalone'`
- [ ] Verificar que .env.production exista
- [ ] Reinstalar Vercel CLI: `npm uninstall -g vercel && npm install -g vercel`

### Si hay error de conexión a MongoDB:
- [ ] Verificar Network Access: 0.0.0.0/0
- [ ] Verificar que usuario de DB existe
- [ ] Verificar connection string es correcto
- [ ] Esperar 2-3 minutos después de cambios en Atlas

### Si hay error CORS:
- [ ] Verificar .env.production del frontend
- [ ] Redesplegar backend
- [ ] Limpiar caché del navegador

---

## ✅ FINAL

- [ ] **TODO FUNCIONA CORRECTAMENTE** ✅

- [ ] **DOCUMENTACIÓN COMPLETA** ✅

- [ ] **PRESENTACIÓN LISTA** ✅

- [ ] **CONFIANZA AL 100%** ✅

---

## 🎉 ¡ÉXITO!

**¡Has completado el despliegue exitoso de tu aplicación en GCP!**

**Fecha de despliegue:** _______________

**Firma:** ___________________________

---

**¡MUCHA SUERTE CON TU PRESENTACIÓN!** 🚀🎓

**¡A CONSEGUIR ESA NOTA!** ⭐⭐⭐⭐⭐
