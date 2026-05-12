# 🔐 Resumen de Arreglos de Seguridad - Priority 1

**Estado**: Completado ✅  
**Fecha**: 10 May 2026  
**Rama**: santiago_tests

---

## 📋 Resumen Ejecutivo

Se implementó validación de **ownership** (propiedad de recurso) en endpoints críticos para eliminar vulnerabilidades IDOR (**Insecure Direct Object Reference**) en reservas y usuarios. Los cambios garantizan que:

- Solo el propietario de una reserva O un admin puede verla/modificarla
- Solo el usuario O un admin puede ver/editar datos de su perfil
- Cualquier intento de acceso cruzado retorna **403 Forbidden**

---

## 📁 Archivos Creados

### 1. `rentacar/back/src/middleware/resourceAuthorization.js` (NUEVO)

**Propósito**: Helper reutilizable para validación de autorización por recurso.

**Funciones principales**:
- `canAccessResource(userId, resourceOwnerId, userRole)`: Valida si usuario tiene acceso (comparación con `String()`)
- `requireResourceOwnershipOrAdmin(ownerField)`: Middleware factory para validación en rutas
- `sendUnauthorizedIfNoAccess(req, resourceOwnerId)`: Validación inline en controladores

**Ventajas**:
- Normaliza comparación de IDs (MongoDB ObjectId vs numérico vs string)
- Reutilizable en cualquier endpoint que necesite validación de propiedad
- Admin siempre tiene acceso total

---

## 📝 Cambios en Controladores

### 2. `rentacar/back/src/controllers/reservaController.js`

**Funciones modificadas**:

#### `getReservasByUsuario()` (línea ~236)
- **Antes**: Devolvía reservas de cualquier usuario si conocías el `usuarioId`
- **Ahora**: Valida que `req.user.id === usuarioId` O `req.user.rol === 'admin'`
- **Retorna**: 403 Forbidden si acceso denegado

#### `getReservaById()` (línea ~265)
- **Antes**: Devolvía una reserva por ID sin verificar propiedad
- **Ahora**: Valida que `req.user.id === reserva.usuario._id` O admin
- **Retorna**: 403 Forbidden si acceso denegado

#### `cancelarReserva()` (línea ~301)
- **Antes**: Permitía cancelar cualquier reserva si conocías el `idReserva`
- **Ahora**: Valida propiedad antes de cambiar estado a Cancelada
- **Retorna**: 403 Forbidden si acceso denegado

#### `generarFactura()` (línea ~449)
- **Antes**: Generaba factura de cualquier reserva sin validar acceso
- **Ahora**: Valida propiedad antes de generar documento
- **Retorna**: 403 Forbidden si acceso denegado

---

### 3. `rentacar/back/src/controllers/usuarioController.js`

**Funciones modificadas**:

#### `getUserById()` (línea ~108)
- **Antes**: Devolvía datos de usuario si conocías su `idUser`
- **Ahora**: Valida que `req.user.idUser === id` O admin
- **Retorna**: 403 Forbidden si acceso denegado

#### `updateUser()` (línea ~149)
- **Antes**: Permitía editar datos de cualquier usuario autenticado
- **Ahora**: Valida que solo el propietario O admin puedan actualizar
- **Retorna**: 403 Forbidden si acceso denegado

#### `updateProfile()` (línea ~203)
- **Antes**: Usaba `req.params.id` sin validar ownership
- **Ahora**: Valida que `req.user.id === id` O admin
- **Retorna**: 403 Forbidden si acceso denegado

---

## 🧪 Pruebas Creadas

### 4. `rentacar/back/tests/anti-idor.test.js` (NUEVO)

**Cobertura**:
1. ✓ Registra dos usuarios regulares
2. ✓ Usuario A no puede ver datos de Usuario B (403)
3. ✓ Usuario A no puede editar datos de Usuario B (403)
4. ✓ Admin SÍ puede acceder a cualquier usuario
5. ✓ Usuario A no puede ver reservas de Usuario B (403)
6. ✓ Usuario A no puede cancelar reservas de Usuario B (403)
7. ✓ Admin SÍ puede ver/modificar reservas de cualquiera

**Ejecución**:
```bash
cd rentacar/back
npm test -- tests/anti-idor.test.js
```

---

## ✅ Hallazgos ALTA Cerrados

| Hallazgo | Solución | Estado |
|----------|----------|--------|
| #12: IDOR en reservas (lectura) | Validación de `req.user.id === reserva.usuario` | ✅ CERRADO |
| #13: IDOR en reservas (modificación) | Validación en `cancelarReserva` y `generarFactura` | ✅ CERRADO |
| #14: IDOR en usuarios | Validación de `req.user.idUser === id` en endpoints de usuario | ✅ CERRADO |

---

## 🔍 Detalles Técnicos

### Normalización de IDs
La comparación se realiza siempre con `String()` para evitar problemas:
```javascript
if (String(req.user.id) !== String(resourceOwnerId) && req.user.rol !== 'admin') {
  return 403;
}
```

Esto funciona con:
- MongoDB ObjectId (`5f8a9c1d3c8e2b1a4d5e6f7g`)
- IDs numéricos (`123`, `456`)
- Strings simples

### Flujo de Autorización
1. **Token válido**: `verifyToken` middleware (ya existente)
2. **Propiedad o admin**: Nueva validación en controlador
3. **Permiso denegado**: Retorna 403, no 401

---

## 📊 Cobertura

**Rutas protegidas ahora**:
- `GET /api/usuarios/:id` → Validación ownership
- `PUT /api/usuarios/:id` → Validación ownership
- `PUT /api/usuarios/:id/profile` → Validación ownership
- `GET /api/reservas/:id` → Validación ownership
- `GET /api/usuarios/:usuarioId/reservas` → Validación ownership
- `PUT /api/reservas/:id/cancelar` → Validación ownership
- `GET /api/reservas/:id/factura` → Validación ownership

**No modificadas** (ya protegidas o públicas):
- `GET /api/autos` → Pública (listado de catálogo)
- `POST /api/reservas` → Token required, usuario es el solicitante
- `GET /api/reservas` → Solo admin (no es por ID)

---

## 🚀 Próximos Pasos Opcionales

### Priority 2 (Funcionalidad):
1. Eliminar fallback silencioso en frontend dashboard/vehiculos
2. Agregar validación explícita de fechas en nueva/page.js

### Priority 3 (UX):
3. Renderizar botones de acción condicionalmente por rol en frontend
4. Unificar sincronización cross-tab en dashboard

---

## 📝 Notas

- **Backend solo**: Esta fase enfocada en cerrar brechas de seguridad críticas en backend
- **Frontend no modificado**: Continuará llamando a APIs, pero recibirá 403 si intenta acceso cruzado
- **Admin unaffected**: Usuarios con `rol === 'admin'` tienen acceso total como antes
- **Tests ejecutables**: Ejecuta `npm test` desde `rentacar/back` para validar

---

## ✔️ Validación Manual Recomendada

1. Crear usuario A, usuario B
2. Obtener token de A
3. Intentar: `GET /api/usuarios/{idB}` con token de A
4. Esperar: **403 Forbidden**
5. Repetir con `/api/reservas/{idReservaB}`
6. Esperar: **403 Forbidden**
7. Cambiar token a admin → **200 OK**

---

**Commit sugerido**:
```
fix(security): Cierra vulnerabilidades IDOR #12, #13, #14

- Agregar validación de ownership en getReservaById, getReservasByUsuario, cancelarReserva, generarFactura
- Agregar validación de ownership en getUserById, updateUser, updateProfile
- Crear helper resourceAuthorization.js para reutilización
- Agregar suite anti-idor.test.js para validación

Todos los endpoints ahora retornan 403 si usuario intenta acceder a recurso ajeno (a menos que sea admin).
```
