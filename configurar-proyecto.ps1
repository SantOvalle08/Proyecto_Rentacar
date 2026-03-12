# Script de configuración rápida para tu proyecto GCP
# Tu proyecto: ProyectoRentaca
# Ejecutar con: .\configurar-proyecto.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CONFIGURACIÓN PROYECTO GCP  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configurar el proyecto
$PROJECT_ID = "proyectorentaca"  # Tu proyecto (en minúsculas)
$REGION = "us-central1"  # Región recomendada

Write-Host "📝 Configurando proyecto GCP..." -ForegroundColor Yellow
Write-Host "   Proyecto: $PROJECT_ID" -ForegroundColor White
Write-Host "   Región: $REGION" -ForegroundColor White
Write-Host ""

# Configurar gcloud
gcloud config set project $PROJECT_ID
gcloud config set compute/region $REGION

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Proyecto configurado correctamente!" -ForegroundColor Green
    Write-Host ""
    
    # Mostrar configuración actual
    Write-Host "📊 Configuración actual:" -ForegroundColor Cyan
    gcloud config list
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  ¡LISTO PARA DESPLEGAR!  " -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Próximos pasos:" -ForegroundColor Yellow
    Write-Host "1. Verifica requisitos:" -ForegroundColor White
    Write-Host "   .\pre-deploy-check.ps1" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "2. Despliega tu aplicación:" -ForegroundColor White
    Write-Host "   .\deploy-gcp.ps1" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host "❌ Error al configurar el proyecto" -ForegroundColor Red
    Write-Host ""
    Write-Host "Verifica que:" -ForegroundColor Yellow
    Write-Host "- Google Cloud CLI está instalado" -ForegroundColor White
    Write-Host "- Estás autenticado (gcloud auth login)" -ForegroundColor White
    Write-Host "- El proyecto '$PROJECT_ID' existe en GCP" -ForegroundColor White
}
