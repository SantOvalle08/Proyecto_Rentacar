# Script de preparación rápida antes del despliegue
# Ejecutar con: .\pre-deploy-check.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  VERIFICACIÓN PRE-DESPLIEGUE  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$issues = @()
$warnings = @()

# 1. Verificar Node.js
Write-Host "🔍 Verificando Node.js..." -ForegroundColor Yellow
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVersion = node --version
    Write-Host "   ✅ Node.js instalado: $nodeVersion" -ForegroundColor Green
} else {
    $issues += "Node.js no está instalado"
    Write-Host "   ❌ Node.js no encontrado" -ForegroundColor Red
}

# 2. Verificar npm
Write-Host "🔍 Verificando npm..." -ForegroundColor Yellow
if (Get-Command npm -ErrorAction SilentlyContinue) {
    $npmVersion = npm --version
    Write-Host "   ✅ npm instalado: $npmVersion" -ForegroundColor Green
} else {
    $issues += "npm no está instalado"
    Write-Host "   ❌ npm no encontrado" -ForegroundColor Red
}

# 3. Verificar Google Cloud CLI
Write-Host "🔍 Verificando Google Cloud CLI..." -ForegroundColor Yellow
if (Get-Command gcloud -ErrorAction SilentlyContinue) {
    $gcloudVersion = gcloud version --format="value(version)"
    Write-Host "   ✅ gcloud instalado" -ForegroundColor Green
    
    # Verificar autenticación
    $account = gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>$null
    if ($account) {
        Write-Host "   ✅ Autenticado como: $account" -ForegroundColor Green
    } else {
        $warnings += "No estás autenticado en gcloud. Ejecuta: gcloud auth login"
        Write-Host "   ⚠️  No autenticado" -ForegroundColor Yellow
    }
} else {
    $issues += "Google Cloud CLI no está instalado. Descarga desde: https://cloud.google.com/sdk/docs/install"
    Write-Host "   ❌ gcloud no encontrado" -ForegroundColor Red
}

# 4. Verificar archivos del backend
Write-Host ""
Write-Host "🔍 Verificando archivos del backend..." -ForegroundColor Yellow
$backendPath = "rentacar\back"

if (Test-Path "$backendPath\package.json") {
    Write-Host "   ✅ package.json encontrado" -ForegroundColor Green
} else {
    $issues += "package.json del backend no encontrado"
    Write-Host "   ❌ package.json no encontrado" -ForegroundColor Red
}

if (Test-Path "$backendPath\Dockerfile") {
    Write-Host "   ✅ Dockerfile encontrado" -ForegroundColor Green
} else {
    $warnings += "Dockerfile del backend no encontrado (necesario para Cloud Run)"
    Write-Host "   ⚠️  Dockerfile no encontrado" -ForegroundColor Yellow
}

if (Test-Path "$backendPath\app.yaml") {
    Write-Host "   ✅ app.yaml encontrado" -ForegroundColor Green
} else {
    $warnings += "app.yaml no encontrado (necesario para App Engine)"
    Write-Host "   ⚠️  app.yaml no encontrado" -ForegroundColor Yellow
}

# 5. Verificar archivos del frontend
Write-Host ""
Write-Host "🔍 Verificando archivos del frontend..." -ForegroundColor Yellow
$frontendPath = "rentacar\front\files"

if (Test-Path "$frontendPath\package.json") {
    Write-Host "   ✅ package.json encontrado" -ForegroundColor Green
} else {
    $issues += "package.json del frontend no encontrado"
    Write-Host "   ❌ package.json no encontrado" -ForegroundColor Red
}

if (Test-Path "$frontendPath\next.config.mjs") {
    Write-Host "   ✅ next.config.mjs encontrado" -ForegroundColor Green
    
    # Verificar configuración standalone
    $nextConfig = Get-Content "$frontendPath\next.config.mjs" -Raw
    if ($nextConfig -match "output.*standalone") {
        Write-Host "   ✅ Configuración standalone habilitada" -ForegroundColor Green
    } else {
        $warnings += "next.config.mjs no tiene 'output: standalone' (necesario para Docker)"
        Write-Host "   ⚠️  Configuración standalone no encontrada" -ForegroundColor Yellow
    }
} else {
    $issues += "next.config.mjs no encontrado"
    Write-Host "   ❌ next.config.mjs no encontrado" -ForegroundColor Red
}

# 6. Verificar dependencias del backend
Write-Host ""
Write-Host "🔍 Verificando dependencias del backend..." -ForegroundColor Yellow
if (Test-Path "$backendPath\node_modules") {
    Write-Host "   ✅ node_modules encontrado" -ForegroundColor Green
} else {
    $warnings += "Dependencias del backend no instaladas. Ejecuta: cd rentacar\back; npm install"
    Write-Host "   ⚠️  node_modules no encontrado" -ForegroundColor Yellow
}

# 7. Verificar dependencias del frontend
Write-Host ""
Write-Host "🔍 Verificando dependencias del frontend..." -ForegroundColor Yellow
if (Test-Path "$frontendPath\node_modules") {
    Write-Host "   ✅ node_modules encontrado" -ForegroundColor Green
} else {
    $warnings += "Dependencias del frontend no instaladas. Ejecuta: cd rentacar\front\files; npm install"
    Write-Host "   ⚠️  node_modules no encontrado" -ForegroundColor Yellow
}

# 8. Verificar archivo .env
Write-Host ""
Write-Host "🔍 Verificando configuración de entorno..." -ForegroundColor Yellow
if (Test-Path "$backendPath\.env") {
    Write-Host "   ✅ .env encontrado" -ForegroundColor Green
    
    # Verificar variables críticas
    $envContent = Get-Content "$backendPath\.env" -Raw
    if ($envContent -match "MONGODB_URI") {
        Write-Host "   ✅ MONGODB_URI configurado" -ForegroundColor Green
    } else {
        $issues += "MONGODB_URI no configurado en .env"
        Write-Host "   ❌ MONGODB_URI no encontrado" -ForegroundColor Red
    }
} else {
    $issues += ".env no encontrado en el backend"
    Write-Host "   ❌ .env no encontrado" -ForegroundColor Red
}

# Resumen
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RESUMEN  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($issues.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host "🎉 ¡Todo listo para el despliegue!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Ejecuta el siguiente comando para desplegar:" -ForegroundColor Cyan
    Write-Host "   .\deploy-gcp.ps1" -ForegroundColor White
} else {
    if ($issues.Count -gt 0) {
        Write-Host "❌ PROBLEMAS CRÍTICOS:" -ForegroundColor Red
        foreach ($issue in $issues) {
            Write-Host "   • $issue" -ForegroundColor Red
        }
        Write-Host ""
    }
    
    if ($warnings.Count -gt 0) {
        Write-Host "⚠️  ADVERTENCIAS:" -ForegroundColor Yellow
        foreach ($warning in $warnings) {
            Write-Host "   • $warning" -ForegroundColor Yellow
        }
        Write-Host ""
    }
    
    if ($issues.Count -gt 0) {
        Write-Host "Por favor, resuelve los problemas críticos antes de continuar." -ForegroundColor Red
    } else {
        Write-Host "Puedes continuar con el despliegue, pero revisa las advertencias." -ForegroundColor Yellow
    }
}

Write-Host ""
