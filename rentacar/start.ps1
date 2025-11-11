# Script para iniciar el proyecto RentaCar
# Arranca backend y frontend en paralelo

Write-Host "Iniciando Proyecto RentaCar..." -ForegroundColor Green
Write-Host ""

# Verificar si Node.js esta instalado
try {
    $nodeVersion = node --version
    Write-Host "Node.js detectado: $nodeVersion" -ForegroundColor Green
}
catch {
    Write-Host "Node.js no esta instalado. Por favor, instala Node.js primero." -ForegroundColor Red
    exit 1
}

# Verificar si MongoDB esta corriendo
Write-Host "Verificando MongoDB..." -ForegroundColor Yellow
$mongoProcess = Get-Process mongod -ErrorAction SilentlyContinue
if ($mongoProcess) {
    Write-Host "MongoDB esta corriendo" -ForegroundColor Green
}
else {
    Write-Host "MongoDB no parece estar corriendo. Asegurate de iniciarlo manualmente." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Iniciando servicios..." -ForegroundColor Cyan
Write-Host ""

# Ruta base del proyecto
$projectRoot = $PSScriptRoot

# Iniciar Backend
Write-Host "Iniciando Backend..." -ForegroundColor Cyan
$backendPath = Join-Path $projectRoot "back"

if (Test-Path $backendPath) {
    # Verificar si node_modules existe
    $backendNodeModules = Join-Path $backendPath "node_modules"
    if (-not (Test-Path $backendNodeModules)) {
        Write-Host "Instalando dependencias del backend..." -ForegroundColor Yellow
        Push-Location $backendPath
        npm install
        Pop-Location
    }
    
    # Iniciar backend en una nueva ventana de PowerShell
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host 'Backend iniciado en http://localhost:5001' -ForegroundColor Green; node start-server.js"
    Write-Host "Backend iniciado en nueva ventana" -ForegroundColor Green
}
else {
    Write-Host "No se encontro la carpeta del backend" -ForegroundColor Red
}

# Esperar un momento para que el backend se inicie
Start-Sleep -Seconds 2

# Iniciar Frontend
Write-Host "Iniciando Frontend..." -ForegroundColor Cyan
$frontendPath = Join-Path $projectRoot "front\files"

if (Test-Path $frontendPath) {
    # Verificar si node_modules existe
    $frontendNodeModules = Join-Path $frontendPath "node_modules"
    if (-not (Test-Path $frontendNodeModules)) {
        Write-Host "Instalando dependencias del frontend..." -ForegroundColor Yellow
        Push-Location $frontendPath
        npm install
        Pop-Location
    }
    
    # Iniciar frontend en una nueva ventana de PowerShell
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; Write-Host 'Frontend iniciado en http://localhost:3000' -ForegroundColor Green; npm run dev"
    Write-Host "Frontend iniciado en nueva ventana" -ForegroundColor Green
}
else {
    Write-Host "No se encontro la carpeta del frontend" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Proyecto RentaCar iniciado correctamente" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "URLs disponibles:" -ForegroundColor Yellow
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   Backend:  http://localhost:5001" -ForegroundColor White
Write-Host ""
Write-Host "Para detener los servicios, cierra las ventanas de PowerShell." -ForegroundColor Gray
Write-Host ""
