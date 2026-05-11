# 🧪 Guía de Validación: Arreglos de Seguridad P1

**Última actualización**: 10 May 2026

---

## ✅ Checklist de Validación Manual

### 1. Verificar que los archivos están en su lugar

```bash
# En la raíz del proyecto
ls -la rentacar/back/src/middleware/resourceAuthorization.js
ls -la rentacar/back/src/controllers/reservaController.js
ls -la rentacar/back/src/controllers/usuarioController.js
ls -la rentacar/back/tests/anti-idor.test.js
```

**Esperado**: Los 4 archivos deben existir.

---

### 2. Validar sintaxis de archivos

```bash
# Navegar al backend
cd rentacar/back

# Ejecutar linter (si está configurado)
npm run lint

# O verificar sintaxis básica con Node
node -c src/middleware/resourceAuthorization.js
node -c src/controllers/reservaController.js
node -c src/controllers/usuarioController.js
node -c tests/anti-idor.test.js
```

**Esperado**: No debe haber errores de sintaxis.

---

### 3. Pruebas Anti-IDOR (Automatizadas)

#### A. Iniciar el servidor backend

```bash
# Terminal 1: Backend
cd rentacar/back
npm install  # Si es primera vez
npm start    # O: node index.js
```

Espera a ver: `✓ Servidor escuchando en puerto 8080` (o el puerto configurado)

#### B. Ejecutar suite de pruebas (en otra terminal)

```bash
# Terminal 2: Tests
cd rentacar/back

# Ejecutar tests anti-IDOR
node tests/anti-idor.test.js
```

**Esperado**: Output similar a:

```
======================================================================
TEST: VALIDACIÓN ANTI-IDOR
======================================================================

TEST 1: Crear dos usuarios y obtener tokens
----------------------------------------------------------------------
  ✓ Usuario 1 registrado
  ✓ Usuario 2 registrado
  ✓ Token Usuario 1 obtenido
  ✓ Token Usuario 2 obtenido
  ✓ Token Admin obtenido

TEST 2: Usuario A intenta acceder a datos de Usuario B (DEBE FALLAR)
----------------------------------------------------------------------
  ✓ Usuario 1 NO puede acceder a datos de Usuario 2

TEST 3: Usuario A intenta actualizar perfil de Usuario B (DEBE FALLAR)
----------------------------------------------------------------------
  ✓ Usuario 1 NO puede actualizar Usuario 2

TEST 4: Admin PUEDE acceder a datos de cualquier usuario
----------------------------------------------------------------------
  ✓ Admin PUEDE acceder a datos de Usuario 1
  ✓ Admin PUEDE acceder a datos de Usuario 2

TEST 5: Crear reservas para ambos usuarios
TEST 6: Usuario A intenta acceder a reservas de Usuario B (DEBE FALLAR)
----------------------------------------------------------------------
  ✓ Usuario 2 NO puede ver reserva de Usuario 1

TEST 7: Usuario A intenta cancelar reserva de Usuario B (DEBE FALLAR)
----------------------------------------------------------------------
  ✓ Usuario 2 NO puede cancelar reserva de Usuario 1

TEST 8: Admin PUEDE ver y cancelar reservas de cualquier usuario
----------------------------------------------------------------------
  ✓ Admin PUEDE ver reserva de Usuario 1

======================================================================
RESULTADO FINAL: 11 passed | 0 failed
======================================================================

✅ VALIDACIÓN EXITOSA: El acceso cruzado está bloqueado correctamente
```

**Si alguna prueba falla** (ej: `✗ Usuario 1 NO puede acceder a datos de Usuario 2`):
- El endpoint aún permite acceso sin validación de ownership
- Revisar que la modificación se aplicó correctamente al controlador

---

### 4. Validación Manual de Endpoints

#### Herramientas: cURL, Postman, o similar

**Paso 1: Registrar Usuario A**

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Usuario A",
    "email": "usuarioa@example.com",
    "contraseña": "PasswordA123"
  }'
```

Guardar el ID de usuario de la respuesta (ej: `idUser: 101`)

**Paso 2: Registrar Usuario B**

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Usuario B",
    "email": "usuariob@example.com",
    "contraseña": "PasswordB123"
  }'
```

Guardar el ID de usuario de la respuesta (ej: `idUser: 102`)

**Paso 3: Login Usuario A y guardar token**

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuarioa@example.com",
    "contraseña": "PasswordA123"
  }'
```

Guardar el token JWT de la respuesta (ej: `eyJhbGciOi...`)

**Paso 4: Intentar acceder a datos de Usuario B con token de A**

```bash
TOKEN_A="eyJhbGciOi..."
USERID_B="102"

curl -X GET "http://localhost:8080/api/usuarios/$USERID_B" \
  -H "Authorization: Bearer $TOKEN_A"
```

**Esperado**: Respuesta 403
```json
{
  "success": false,
  "message": "No tienes permiso para acceder a este recurso"
}
```

**Paso 5: Intentar editar perfil de Usuario B con token de A**

```bash
curl -X PUT "http://localhost:8080/api/usuarios/$USERID_B/profile" \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Nombre Falso",
    "telefono": "9999999999"
  }'
```

**Esperado**: Respuesta 403

**Paso 6: Verificar que admin SÍ puede acceder**

```bash
# Login como admin
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@rentacar.com",
    "contraseña": "Admin123456"
  }'

# Guardar token admin
TOKEN_ADMIN="eyJhbGciOi..."

# Acceder a datos de Usuario A como admin
curl -X GET "http://localhost:8080/api/usuarios/101" \
  -H "Authorization: Bearer $TOKEN_ADMIN"
```

**Esperado**: Respuesta 200 con datos del usuario

---

## 🔍 Checklist de Código

### Archivo: `resourceAuthorization.js`

- [ ] Existe función `canAccessResource()`
- [ ] Existe función `requireResourceOwnershipOrAdmin()`
- [ ] Existe función `sendUnauthorizedIfNoAccess()`
- [ ] Todas las comparaciones de ID usan `String()`
- [ ] Admin siempre tiene acceso (`userRole === 'admin'`)

### Archivo: `reservaController.js`

- [ ] `getReservasByUsuario`: Valida `req.user.id === usuarioId` O admin
- [ ] `getReservaById`: Valida `req.user.id === reserva.usuario._id` O admin
- [ ] `cancelarReserva`: Valida antes de cambiar estado
- [ ] `generarFactura`: Valida antes de generar documento
- [ ] Todas retornan 403 si acceso denegado

### Archivo: `usuarioController.js`

- [ ] `getUserById`: Valida `req.user.idUser === id` O admin
- [ ] `updateUser`: Valida antes de actualizar campos
- [ ] `updateProfile`: Valida `req.user.id === id` O admin
- [ ] Todas retornan 403 si acceso denegado

---

## 📊 Métricas de Éxito

| Métrica | Criterio | Estado |
|---------|----------|--------|
| **Tests automáticos** | 11/11 passing | ✓ Si ejecutas tests |
| **Endpoints endurecidos** | 7/7 con ownership validation | ✓ Código presente |
| **Acceso cruzado bloqueado** | Usuario A no accede a recurso de B | ✓ Manual test |
| **Admin acceso total** | Admin accede a todo | ✓ Manual test |
| **Error code correcto** | 403 Forbidden (no 401 Unauthorized) | ✓ Manual test |

---

## 🐛 Troubleshooting

### Error: "Token Usuario 1 obtenido" falla

**Causa**: Login fallando
- Verificar que admin existe en base de datos
- Verificar que contraseña está correcta en código de tests
- Revisar logs del backend

**Solución**:
```bash
# En backend, ejecutar init-admin.js si es necesario
node init-admin.js
```

### Error: "Usuario 1 NO puede acceder a datos de Usuario 2" falla

**Causa**: La validación NO se aplicó al endpoint
- Verificar que el cambio está en el archivo correcto
- Verificar que no hay caché o proceso viejo ejecutándose
- Reiniciar servidor backend: `Ctrl+C` en Terminal 1, luego `npm start`

### Error: "Admin PUEDE acceder..." falla

**Causa**: Lógica admin está invertida
- Verificar que comparación es `req.user.rol === 'admin'`
- Verificar que admin usuario existe y tiene `rol: 'admin'` en DB

### Error: 500 Internal Server Error

**Causa**: Error en código modificado
- Revisar logs del backend en Terminal 1
- Buscar errores de sintaxis con `node -c archivo.js`
- Revisar que todas las propiedades de `req.user` existen

---

## ✅ Validación Final

Una vez pasadas TODAS las pruebas anteriores, el trabajo puede considerarse:

- ✅ **Completado**: Los 3 hallazgos ALTA (#12, #13, #14) están cerrados
- ✅ **Validado**: Tests automáticos + pruebas manuales exitosas
- ✅ **Documentado**: ARREGLOS_SEGURIDAD_P1.md describe todos los cambios

---

**Siguiente paso recomendado**: Priority 2 (eliminar fallback en frontend, validación de fechas)

Archivo de referencia: [HALLAZGOS_RESTANTES.md](HALLAZGOS_RESTANTES.md)
