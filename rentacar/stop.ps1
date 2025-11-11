# Script para detener el proyecto RentaCar
# Detiene todos los procesos de Node relacionados con el proyecto

Write-Host "Deteniendo Proyecto RentaCar..." -ForegroundColor Red
Write-Host ""

# Funcion para detener procesos por puerto
function Stop-ProcessByPort {
    param (
        [int]$Port,
        [string]$ServiceName
    )
    
    try {
        $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        if ($connection) {
            $processId = $connection.OwningProcess
            $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
            
            if ($process) {
                Stop-Process -Id $processId -Force
                Write-Host "$ServiceName detenido (PID: $processId)" -ForegroundColor Green
                return $true
            }
        }
        Write-Host "$ServiceName no esta corriendo en el puerto $Port" -ForegroundColor Yellow
        return $false
    }
    catch {
        Write-Host "No se pudo detener $ServiceName" -ForegroundColor Yellow
        return $false
    }
}

# Funcion para detener procesos de Node.js relacionados con el proyecto
function Stop-ProjectNodeProcesses {
    $projectRoot = $PSScriptRoot
    $stoppedCount = 0
    
    $nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
    
    if ($nodeProcesses) {
        foreach ($proc in $nodeProcesses) {
            try {
                $commandLine = (Get-CimInstance Win32_Process -Filter "ProcessId = $($proc.Id)").CommandLine
                
                # Verificar si el proceso esta relacionado con nuestro proyecto
                if ($commandLine -match [regex]::Escape($projectRoot)) {
                    Stop-Process -Id $proc.Id -Force
                    Write-Host "Proceso Node detenido (PID: $($proc.Id))" -ForegroundColor Green
                    $stoppedCount++
                }
            }
            catch {
                # Ignorar errores si no se puede acceder al proceso
            }
        }
    }
    
    return $stoppedCount
}

Write-Host "Buscando procesos del proyecto..." -ForegroundColor Cyan
Write-Host ""

# Detener por puertos especificos
$backendStopped = Stop-ProcessByPort -Port 5001 -ServiceName "Backend"
Start-Sleep -Milliseconds 500

$frontendStopped = Stop-ProcessByPort -Port 3000 -ServiceName "Frontend"
Start-Sleep -Milliseconds 500

# Si no se detuvo por puerto, intentar detener por procesos relacionados
if (-not $backendStopped -and -not $frontendStopped) {
    Write-Host "Buscando procesos Node.js del proyecto..." -ForegroundColor Cyan
    $stoppedCount = Stop-ProjectNodeProcesses
    
    if ($stoppedCount -gt 0) {
        Write-Host "Se detuvieron $stoppedCount proceso(s)" -ForegroundColor Green
    }
    else {
        Write-Host "No se encontraron procesos activos del proyecto" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Red
Write-Host "Proyecto RentaCar detenido" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""
Write-Host "Para reiniciar el proyecto, ejecuta: .\start.ps1" -ForegroundColor Gray
Write-Host ""
