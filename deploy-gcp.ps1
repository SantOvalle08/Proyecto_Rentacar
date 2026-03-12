# Script de despliegue automatizado para Google Cloud Platform
# Ejecutar con: .\deploy-gcp.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DESPLIEGUE RENTACAR EN GOOGLE CLOUD  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si gcloud está instalado
if (!(Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Host "❌ ERROR: Google Cloud CLI no está instalado." -ForegroundColor Red
    Write-Host "Descarga desde: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    exit 1
}

# Configuración
$PROJECT_ID = Read-Host "Ingresa el ID de tu proyecto GCP (ej: proyectorentaca)"
$REGION = Read-Host "Ingresa la región (presiona Enter para us-central1)" 
if ([string]::IsNullOrWhiteSpace($REGION)) {
    $REGION = "us-central1"
}

Write-Host ""
Write-Host "📝 Configurando proyecto..." -ForegroundColor Yellow
gcloud config set project $PROJECT_ID

# Opción de despliegue
Write-Host ""
Write-Host "Selecciona el tipo de despliegue:" -ForegroundColor Cyan
Write-Host "1. App Engine (Más simple, recomendado)"
Write-Host "2. Cloud Run (Más flexible)"
$opcion = Read-Host "Opción (1 o 2)"

# Desplegar Backend
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  DESPLEGANDO BACKEND  " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

$BACKEND_PATH = "rentacar\back"
Set-Location $BACKEND_PATH

if ($opcion -eq "1") {
    # App Engine
    Write-Host "🚀 Desplegando backend en App Engine..." -ForegroundColor Yellow
    gcloud app deploy --quiet
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Backend desplegado exitosamente!" -ForegroundColor Green
        $BACKEND_URL = gcloud app describe --format="value(defaultHostname)"
        $BACKEND_URL = "https://$BACKEND_URL"
    } else {
        Write-Host "❌ Error al desplegar el backend" -ForegroundColor Red
        exit 1
    }
} else {
    # Cloud Run
    Write-Host "🚀 Desplegando backend en Cloud Run..." -ForegroundColor Yellow
    
    # Construir imagen
    Write-Host "📦 Construyendo imagen Docker..." -ForegroundColor Yellow
    gcloud builds submit --tag gcr.io/$PROJECT_ID/rentacar-backend --quiet
    
    # Desplegar
    Write-Host "🚢 Desplegando servicio..." -ForegroundColor Yellow
    gcloud run deploy rentacar-backend `
        --image gcr.io/$PROJECT_ID/rentacar-backend `
        --platform managed `
        --region $REGION `
        --allow-unauthenticated `
        --quiet
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Backend desplegado exitosamente!" -ForegroundColor Green
        $BACKEND_URL = gcloud run services describe rentacar-backend --region=$REGION --format="value(status.url)"
    } else {
        Write-Host "❌ Error al desplegar el backend" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "🔗 URL del Backend: $BACKEND_URL" -ForegroundColor Cyan

# Volver al directorio raíz
Set-Location ..\..

# Configurar Frontend
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  CONFIGURANDO FRONTEND  " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

$FRONTEND_PATH = "rentacar\front\files"
Set-Location $FRONTEND_PATH

# Crear archivo .env.production con la URL del backend
$envContent = "NEXT_PUBLIC_API_URL=$BACKEND_URL"
Set-Content -Path ".env.production" -Value $envContent
Write-Host "✅ Archivo .env.production creado" -ForegroundColor Green

Write-Host ""
Write-Host "Selecciona cómo desplegar el frontend:" -ForegroundColor Cyan
Write-Host "1. Vercel (Más rápido, recomendado para Next.js)"
Write-Host "2. Cloud Run"
Write-Host "3. Saltar (desplegar manualmente después)"
$opcionFront = Read-Host "Opción (1, 2 o 3)"

if ($opcionFront -eq "1") {
    # Verificar si Vercel CLI está instalado
    if (!(Get-Command vercel -ErrorAction SilentlyContinue)) {
        Write-Host "📦 Instalando Vercel CLI..." -ForegroundColor Yellow
        npm install -g vercel
    }
    
    Write-Host "🚀 Desplegando en Vercel..." -ForegroundColor Yellow
    Write-Host "⚠️  Sigue las instrucciones en pantalla de Vercel" -ForegroundColor Yellow
    vercel --prod
    
} elseif ($opcionFront -eq "2") {
    Write-Host "🚀 Desplegando frontend en Cloud Run..." -ForegroundColor Yellow
    
    # Construir imagen
    Write-Host "📦 Construyendo imagen Docker..." -ForegroundColor Yellow
    gcloud builds submit --tag gcr.io/$PROJECT_ID/rentacar-frontend --quiet
    
    # Desplegar
    Write-Host "🚢 Desplegando servicio..." -ForegroundColor Yellow
    gcloud run deploy rentacar-frontend `
        --image gcr.io/$PROJECT_ID/rentacar-frontend `
        --platform managed `
        --region $REGION `
        --allow-unauthenticated `
        --quiet
    
    if ($LASTEXITCODE -eq 0) {
        $FRONTEND_URL = gcloud run services describe rentacar-frontend --region=$REGION --format="value(status.url)"
        Write-Host "✅ Frontend desplegado exitosamente!" -ForegroundColor Green
        Write-Host "🔗 URL del Frontend: $FRONTEND_URL" -ForegroundColor Cyan
    }
}

# Volver al directorio raíz
Set-Location ..\..\..

# Resumen
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ DESPLIEGUE COMPLETADO  " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 RESUMEN:" -ForegroundColor Cyan
Write-Host "   Backend URL:  $BACKEND_URL" -ForegroundColor White
if ($opcionFront -eq "2") {
    Write-Host "   Frontend URL: $FRONTEND_URL" -ForegroundColor White
}
Write-Host ""
Write-Host "📝 Próximos pasos:" -ForegroundColor Yellow
Write-Host "   1. Verifica que MongoDB Atlas permita conexiones desde GCP"
Write-Host "   2. Actualiza las variables de entorno si es necesario"
Write-Host "   3. Prueba la aplicación en las URLs mostradas arriba"
Write-Host ""
Write-Host "🔍 Ver logs:" -ForegroundColor Yellow
if ($opcion -eq "1") {
    Write-Host "   gcloud app logs tail -s default"
} else {
    Write-Host "   gcloud logging read 'resource.type=cloud_run_revision' --limit 50"
}
Write-Host ""
Write-Host "¡Buena suerte! 🎉" -ForegroundColor Green
