# Despliegue de RentaCar en AWS (Proceso Real)

## Resumen
Este documento describe el proceso completo de despliegue de la aplicacion RentaCar en AWS, incluyendo decisiones tecnicas, configuracion utilizada, errores encontrados y soluciones aplicadas.

Arquitectura final desplegada:
- Backend: AWS App Runner (imagen Docker en ECR)
- Frontend: AWS App Runner (imagen Docker en ECR)
- Base de datos: MongoDB Atlas
- Region AWS: `us-east-2`

Cuenta AWS utilizada:
- Account ID: `006422308185`

Repositorios ECR utilizados:
- Backend: `rentacar/back`
- Frontend: `rentacar/front`

## 1. Preparacion inicial

Se realizo configuracion local de AWS CLI y autenticacion:

```powershell
aws configure
aws sts get-caller-identity
```

Validacion correcta:
- Se obtuvo `Account`, `Arn` y `UserId`.

Luego se hizo login en ECR:

```powershell
aws ecr get-login-password --region us-east-2 | docker login --username AWS --password-stdin 006422308185.dkr.ecr.us-east-2.amazonaws.com
```

## 2. Despliegue del backend

### 2.1 Dockerfile backend
Archivo usado: `rentacar/back/Dockerfile`

Configuracion clave:
- Base image: `node:20-alpine`
- Puerto expuesto: `8080`
- Comando de arranque: `node index.js`

### 2.2 Build, tag y push a ECR

```powershell
$REGION="us-east-2"
$ACCOUNT_ID="006422308185"
$BACK_REPO="rentacar/back"
$TAG="fix-20260315-1"

cd C:\Users\santi\OneDrive\Desktop\Proyectos\GitHub\Proyecto_Rentacar\rentacar\back

docker build --no-cache -t "${BACK_REPO}:${TAG}" .
docker tag "${BACK_REPO}:${TAG}" "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/${BACK_REPO}:${TAG}"
docker push "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/${BACK_REPO}:${TAG}"
```

### 2.3 Creacion del servicio en App Runner
Configuracion utilizada:
- Source: Amazon ECR
- Image: `rentacar/back:<tag>`
- Port: `8080`
- Health check: HTTP en `/`
- CPU/Memoria recomendada: 1 vCPU / 2 GB

Variables de entorno:
- `PORT=8080`
- `NODE_ENV=production`
- `MONGODB_URI=mongodb+srv://<usuario>:<password>@<cluster>.mongodb.net/rentacar?retryWrites=true&w=majority&appName=rentarCar`
- `JWT_SECRET=<secret>`

Importante:
- La URI debe incluir `/rentacar` para que la aplicacion use esa base y no la base por defecto `test`.
- Si la contraseña tiene caracteres especiales, deben ir codificados en URL.

## 3. Error principal del backend y solucion

### Error observado
- App Runner reportaba: `Container exit code: 1`
- El despliegue fallaba durante health check.

### Causa
El backend terminaba el proceso en produccion si MongoDB no conectaba al inicio.

### Correccion aplicada
Se ajusto codigo para no cerrar el proceso y reintentar conexion en segundo plano.

Archivos modificados:
- `rentacar/back/index.js`
- `rentacar/back/src/config/database.js`

Cambios funcionales:
- Eliminacion de salida forzada por error inicial de DB.
- Inicio del servidor aunque Mongo no este disponible en el primer intento.
- Reintentos periodicos de reconexion (background reconnect).

Resultado:
- El backend quedo desplegado y operativo.

## 4. Despliegue del frontend

### 4.1 Dockerfile frontend
Archivo usado: `rentacar/front/files/Dockerfile`

Version final estable para App Runner:
- Base image: `node:20-alpine`
- Build con `npm install` (evita bloqueo por lockfile desincronizado)
- Build arg: `NEXT_PUBLIC_API_URL`
- `NODE_OPTIONS=--max-old-space-size=2048`
- Arranque: `npm run start -- -p 3000 -H 0.0.0.0`
- Puerto: `3000`

### 4.2 Build, tag y push a ECR

```powershell
$REGION="us-east-2"
$ACCOUNT_ID="006422308185"
$FRONT_REPO="rentacar/front"
$FRONT_TAG="front-20260315-4"
$BACKEND_URL="https://<backend-url>.awsapprunner.com"

cd C:\Users\santi\OneDrive\Desktop\Proyectos\GitHub\Proyecto_Rentacar\rentacar\front\files

docker build --no-cache --build-arg NEXT_PUBLIC_API_URL=$BACKEND_URL -t "${FRONT_REPO}:${FRONT_TAG}" .
docker tag "${FRONT_REPO}:${FRONT_TAG}" "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/${FRONT_REPO}:${FRONT_TAG}"
docker push "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/${FRONT_REPO}:${FRONT_TAG}"
```

### 4.3 Creacion del servicio frontend en App Runner
Configuracion utilizada:
- Source: Amazon ECR
- Image: `rentacar/front:<tag>`
- Port: `3000`
- Health check: HTTP
- Path recomendado: `/` (o `/api/health`)

Variables de entorno:
- `PORT=3000`
- `NODE_ENV=production`

## 5. Errores del frontend y soluciones

### Error 1: `npm ci` fallo en Docker build
Mensaje:
- `npm ci can only install packages when your package.json and package-lock.json are in sync`

Solucion:
- Cambiar instalacion en Dockerfile de `npm ci` a `npm install`.

### Error 2: Health check fallido en App Runner
Mensaje:
- `Health check failed` en puerto 3000.

Soluciones aplicadas:
- Ajuste de runtime del contenedor para bind explicito a `0.0.0.0:3000`.
- Agregado endpoint de health dedicado.

Archivo agregado:
- `rentacar/front/files/src/app/api/health/route.js`

Endpoint:
- `GET /api/health` responde JSON de estado.

## 6. Resultado final

Estado final alcanzado:
- Backend desplegado y funcionando en App Runner.
- Frontend desplegado y funcionando en App Runner.
- Integracion frontend-backend operativa mediante `NEXT_PUBLIC_API_URL`.

Verificaciones recomendadas post-deploy:
- Backend root: `https://<backend-url>/`
- Frontend root: `https://<frontend-url>/`
- Health frontend: `https://<frontend-url>/api/health`

## 7. Lecciones aprendidas

1. En ECR, el nombre del repo debe coincidir exactamente con el usado en `docker push`.
2. En Next.js con App Runner, es mas estable usar runtime explicito en `0.0.0.0:3000`.
3. Health checks deben apuntar a una ruta simple y siempre disponible.
4. Para evitar caidas en cloud, el backend no debe terminar proceso por falla temporal de DB.
5. Usar tags nuevos por despliegue evita cache ambiguo (`latest` puede confundir).

## 8. Seguridad

Recomendaciones aplicables:
- Rotar credenciales de MongoDB si fueron expuestas.
- No subir secretos al repositorio.
- Usar variables de entorno en App Runner para secretos.

## 9. Comandos rapidos de referencia

Backend:

```powershell
$REGION="us-east-2"
$ACCOUNT_ID="006422308185"
$BACK_REPO="rentacar/back"
$TAG="backend-<fecha>"

docker build --no-cache -t "${BACK_REPO}:${TAG}" .
docker tag "${BACK_REPO}:${TAG}" "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/${BACK_REPO}:${TAG}"
docker push "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/${BACK_REPO}:${TAG}"
```

Frontend:

```powershell
$REGION="us-east-2"
$ACCOUNT_ID="006422308185"
$FRONT_REPO="rentacar/front"
$FRONT_TAG="front-<fecha>"
$BACKEND_URL="https://<backend-url>.awsapprunner.com"

docker build --no-cache --build-arg NEXT_PUBLIC_API_URL=$BACKEND_URL -t "${FRONT_REPO}:${FRONT_TAG}" .
docker tag "${FRONT_REPO}:${FRONT_TAG}" "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/${FRONT_REPO}:${FRONT_TAG}"
docker push "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/${FRONT_REPO}:${FRONT_TAG}"
```

---
Documento generado segun el proceso real ejecutado durante el despliegue en AWS.
