# 🎯 GUÍA PASO A PASO SUPER SIMPLE - Desde Cero

## ⏱️ Tiempo: 45 minutos | Dificultad: ⭐ Muy Fácil

Voy a guiarte paso a paso. Solo sigue las instrucciones en orden.

---

## 📱 PARTE 1: PREPARAR MONGODB ATLAS (10 min)

### Paso 1.1: Crear cuenta en MongoDB Atlas

1. Abre tu navegador y ve a: **https://cloud.mongodb.com**

2. Click en **"Try Free"** o **"Sign Up"**

3. Regístrate con tu email de Google (es más rápido)

4. **IMPORTANTE:** Guarda tu usuario y contraseña

---

### Paso 1.2: Crear un Cluster (Base de datos)

1. Después de iniciar sesión, verás un botón **"Build a Database"** o **"Create"**
   - Click ahí

2. Te preguntará qué tipo:
   - Selecciona: **"M0 FREE"** (el gratuito)
   - Click **"Create"**

3. Te preguntará la región:
   - Selecciona: **"AWS"** y **"N. Virginia (us-east-1)"**
   - Click **"Create Cluster"**

4. **Espera 2-3 minutos** mientras se crea el cluster ☕

---

### Paso 1.3: Crear un Usuario para la Base de Datos

1. Mientras se crea el cluster, aparecerá una ventana de **"Security Quickstart"**

2. En **"Authentication Method"**:
   - Elige: **"Username and Password"**
   - Username: Escribe `admin`
   - Password: Click en **"Autogenerate Secure Password"**
   - **MUY IMPORTANTE:** Click en **"Copy"** y pega la contraseña en un Notepad
   - Click **"Create User"**

---

### Paso 1.4: Permitir Acceso desde Cualquier IP

1. En la misma ventana, baja hasta **"Where would you like to connect from?"**

2. Click en **"Add My Current IP Address"**

3. **IMPORTANTE:** Ahora click en **"Add a Different IP Address"**
   - IP Address: Escribe `0.0.0.0/0`
   - Description: Escribe `Permitir todos`
   - Click **"Add Entry"**

4. Click **"Finish and Close"**

5. Click **"Go to Databases"**

---

### Paso 1.5: Copiar tu Connection String

1. En la pantalla de Databases, verás tu cluster

2. Click en el botón **"Connect"**

3. Click en **"Drivers"**

4. Verás un texto como:
   ```
   mongodb+srv://admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

5. Click en **"Copy"**

6. **MUY IMPORTANTE:**
   - Pega esto en un Notepad
   - Reemplaza `<password>` con la contraseña que copiaste antes
   - Ejemplo final:
     ```
     mongodb+srv://admin:MiPass123@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```

---

## ☁️ PARTE 2: CONFIGURAR GOOGLE CLOUD (5 min)

### Paso 2.1: Verificar que Google Cloud CLI esté instalado

1. Abre **PowerShell** (búscalo en el menú de Windows)

2. Escribe este comando y presiona Enter:
   ```powershell
   gcloud version
   ```

3. **Si aparece una versión:** ✅ Continúa al Paso 2.2

4. **Si dice "no se reconoce el comando":**
   - Ve a: **https://cloud.google.com/sdk/docs/install**
   - Descarga el instalador para Windows
   - Instálalo (siguiente, siguiente, siguiente)
   - **Cierra y abre PowerShell de nuevo**
   - Intenta el comando otra vez

---

### Paso 2.2: Iniciar sesión en Google Cloud

1. En PowerShell, escribe:
   ```powershell
   gcloud auth login
   ```

2. Se abrirá tu navegador

3. **Selecciona tu cuenta de Google**

4. Click en **"Permitir"** o **"Allow"**

5. Verás un mensaje: **"You are now logged in"**

6. Cierra la pestaña del navegador

---

### Paso 2.3: Configurar tu proyecto

1. Ve a **PowerShell** de nuevo

2. Escribe:
   ```powershell
   gcloud config set project proyectorentaca
   ```

3. Si funciona, verás: `Updated property [core/project].`

4. Ahora escribe:
   ```powershell
   gcloud config set compute/region us-central1
   ```

---

## 📝 PARTE 3: CREAR ARCHIVO .env (5 min)

### Paso 3.1: Navegar a la carpeta del backend

1. En PowerShell, copia y pega esto (todo junto):
   ```powershell
   cd C:\Users\santi\OneDrive\Desktop\Proyectos\GitHub\Proyecto_Rentacar\rentacar\back
   ```

2. Presiona Enter

---

### Paso 3.2: Crear el archivo .env

**IMPORTANTE:** Antes de ejecutar esto, ve a tu Notepad donde pegaste el connection string de MongoDB.

1. Copia este código COMPLETO:
   ```powershell
   @"
   MONGODB_URI=TU-CONNECTION-STRING-AQUI
   PORT=8080
   NODE_ENV=production
   JWT_SECRET=mi-super-secreto-aleatorio-12345-xyz
   "@ | Out-File -FilePath .env -Encoding utf8
   ```

2. **REEMPLAZA** `TU-CONNECTION-STRING-AQUI` con tu connection string real de MongoDB

3. Ejemplo final:
   ```powershell
   @"
   MONGODB_URI=mongodb+srv://admin:MiPass123@cluster0.xxxxx.mongodb.net/rentacar?retryWrites=true&w=majority
   PORT=8080
   NODE_ENV=production
   JWT_SECRET=mi-super-secreto-aleatorio-12345-xyz
   "@ | Out-File -FilePath .env -Encoding utf8
   ```

4. Pega el código en PowerShell y presiona Enter

---

### Paso 3.3: Verificar que se creó

1. Escribe:
   ```powershell
   Get-Content .env
   ```

2. Deberías ver tu configuración. Si se ve bien, ✅ continúa.

---

## 🚀 PARTE 4: DESPLEGAR BACKEND (10 min)

### Paso 4.1: Desplegar a Google App Engine

1. **Estás en la carpeta correcta** (rentacar\back), ahora escribe:
   ```powershell
   gcloud app deploy
   ```

2. Te preguntará: **"Please choose the region"**
   - Escribe el número que corresponda a **us-central1**
   - Presiona Enter

3. Te preguntará: **"Do you want to continue (Y/n)?"**
   - Escribe `Y` y presiona Enter

4. **ESPERA 5-10 MINUTOS** ☕☕☕
   - Verás muchas líneas de texto
   - Es normal, está instalando todo

5. Al final verás algo como:
   ```
   Deployed service [default] to [https://proyectorentaca.uc.r.appspot.com]
   ```

6. **MUY IMPORTANTE:**
   - Copia esa URL (https://proyectorentaca......)
   - Pégala en un Notepad
   - La necesitarás para el frontend

---

### Paso 4.2: Probar que funciona

1. En PowerShell, escribe (reemplaza con TU URL):
   ```powershell
   curl https://proyectorentaca.uc.r.appspot.com
   ```

2. Deberías ver algo como:
   ```json
   {"message":"API de RentaCar","version":"1.0.0"...}
   ```

3. Si ves eso, ✅ **¡FUNCIONA!**

---

## 🎨 PARTE 5: DESPLEGAR FRONTEND (10 min)

### Paso 5.1: Ir a la carpeta del frontend

1. En PowerShell, escribe:
   ```powershell
   cd ..\front\files
   ```

---

### Paso 5.2: Crear archivo .env.production

1. Toma la URL de tu backend que guardaste (https://proyectorentaca...)

2. Copia este código:
   ```powershell
   @"
   NEXT_PUBLIC_API_URL=TU-URL-DEL-BACKEND-AQUI
   "@ | Out-File -FilePath .env.production -Encoding utf8
   ```

3. **REEMPLAZA** `TU-URL-DEL-BACKEND-AQUI` con tu URL real

4. Ejemplo final:
   ```powershell
   @"
   NEXT_PUBLIC_API_URL=https://proyectorentaca.uc.r.appspot.com
   "@ | Out-File -FilePath .env.production -Encoding utf8
   ```

5. Pega en PowerShell y presiona Enter

---

### Paso 5.3: Instalar Vercel CLI

1. Escribe:
   ```powershell
   npm install -g vercel
   ```

2. Espera 1-2 minutos

---

### Paso 5.4: Desplegar en Vercel

1. Escribe:
   ```powershell
   vercel --prod
   ```

2. Te hará varias preguntas:

   **"Set up and deploy?"**
   - Escribe: `Y` + Enter

   **"Which scope?"**
   - Presiona Enter (usa el default)

   **"Link to existing project?"**
   - Escribe: `N` + Enter

   **"What's your project's name?"**
   - Escribe: `rentacar` + Enter

   **"In which directory is your code located?"**
   - Escribe: `.` (un punto) + Enter

   **"Want to override the settings?"**
   - Escribe: `N` + Enter

3. **ESPERA 3-5 MINUTOS** ☕

4. Al final verás:
   ```
   Production: https://rentacar-xxxxx.vercel.app
   ```

5. **¡ESA ES LA URL DE TU APLICACIÓN!** 🎉

---

## ✅ PARTE 6: PROBAR TU APLICACIÓN (5 min)

### Paso 6.1: Abrir tu app

1. **Copia la URL que te dio Vercel**
   - Ejemplo: `https://rentacar-xxxxx.vercel.app`

2. **Pégala en tu navegador** y presiona Enter

3. **Deberías ver tu aplicación RentaCar** 🎉

---

### Paso 6.2: Probar funcionalidades

1. **Registro:**
   - Click en "Registrarse"
   - Crea un usuario de prueba
   - Email: `prueba@test.com`
   - Contraseña: `Test123!`

2. **Login:**
   - Inicia sesión con el usuario que creaste

3. **Ver catálogo:**
   - Click en "Catálogo" o "Autos"
   - Deberías ver los autos

4. **Si todo funciona:** ✅ **¡LO LOGRASTE!** 🎉🎉🎉

---

## 📸 PARTE 7: TOMAR CAPTURAS PARA TU PRESENTACIÓN

### Capturas que necesitas:

1. **Google Cloud Console:**
   - Ve a: https://console.cloud.google.com/appengine
   - Toma captura de tu aplicación desplegada

2. **MongoDB Atlas:**
   - Ve a: https://cloud.mongodb.com
   - Toma captura de tu cluster

3. **Tu aplicación funcionando:**
   - Home page
   - Página de catálogo
   - Una reserva creada
   - Tu perfil

4. **PowerShell con el comando de despliegue**

---

## 🆘 SI ALGO SALE MAL

### Error: "Cannot connect to MongoDB"

**Solución:**
1. Ve a MongoDB Atlas: https://cloud.mongodb.com
2. Click en "Network Access" (menú izquierdo)
3. Verifica que esté `0.0.0.0/0` en la lista
4. Si no está, agrégalo:
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere"
   - Click "Confirm"
5. **Espera 2-3 minutos**
6. Intenta de nuevo

---

### Error: "Project not found"

**Solución:**
1. Ve a: https://console.cloud.google.com
2. Arriba a la izquierda, click en el nombre del proyecto
3. Busca "ProyectoRentaca" o como se llame tu proyecto
4. Cópialo EXACTAMENTE como aparece
5. En PowerShell:
   ```powershell
   gcloud config set project NOMBRE-EXACTO-DEL-PROYECTO
   ```

---

### Error: "gcloud no se reconoce"

**Solución:**
1. Descarga: https://cloud.google.com/sdk/docs/install
2. Instala
3. **CIERRA PowerShell completamente**
4. Abre PowerShell NUEVO
5. Intenta de nuevo

---

### Error en Vercel: "Build failed"

**Solución:**
1. Verifica que .env.production exista:
   ```powershell
   Get-Content .env.production
   ```
2. Si no existe, créalo de nuevo (Parte 5, Paso 5.2)
3. Intenta desplegar de nuevo:
   ```powershell
   vercel --prod
   ```

---

## 📞 NECESITAS AYUDA URGENTE?

### Ver logs del backend:
```powershell
gcloud app logs tail -s default
```

### Ver tu configuración de GCP:
```powershell
gcloud config list
```

### Ver tus proyectos de GCP:
```powershell
gcloud projects list
```

---

## ✅ CHECKLIST FINAL

Marca lo que ya completaste:

- [ ] MongoDB Atlas creado
- [ ] Usuario de base de datos creado
- [ ] IP 0.0.0.0/0 agregada a Network Access
- [ ] Connection string copiado
- [ ] Google Cloud CLI instalado
- [ ] Iniciado sesión con gcloud
- [ ] Archivo .env creado en backend
- [ ] Backend desplegado en App Engine
- [ ] URL del backend copiada
- [ ] Archivo .env.production creado en frontend
- [ ] Frontend desplegado en Vercel
- [ ] Aplicación funcionando correctamente
- [ ] Capturas de pantalla tomadas

---

## 🎉 ¡FELICITACIONES!

**Has desplegado exitosamente una aplicación full-stack en la nube!**

**Tus URLs:**
- Backend: https://proyectorentaca.uc.r.appspot.com
- Frontend: https://rentacar-xxxxx.vercel.app (la que te dio Vercel)

**Compártelas con tu profesor y compañeros!** 🚀

---

## 💡 TIPS PARA TU PRESENTACIÓN

1. **Ten las URLs a mano** en un papel o notepad

2. **Practica la demo** antes de presentar

3. **Ten plan B:** Si falla internet, muestra las capturas

4. **Explica la arquitectura:**
   - Frontend en Vercel (CDN global)
   - Backend en Google App Engine (escalable)
   - Base de datos en MongoDB Atlas (cloud)

5. **Menciona que es gratis** con los free tiers

6. **Tiempo total:** Menos de 1 hora

---

**¡MUCHA SUERTE CON TU PRESENTACIÓN!** 🎓⭐

**De esto depende tu nota, y lo has logrado!** 💪
