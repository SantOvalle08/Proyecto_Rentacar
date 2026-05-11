param(
  [string]$Region = "us-east-2",
  [string]$AccountId = "006422308185",
  [string]$BackendRepo = "rentacar/back",
  [string]$FrontendRepo = "rentacar/front",
  [string]$BackendServiceArn = "arn:aws:apprunner:us-east-2:006422308185:service/rentacar-backend/b4b01b19aa9141efba9808959dd5dd40",
  [string]$FrontendServiceArn = "arn:aws:apprunner:us-east-2:006422308185:service/rentacar-frontend/3dd31140bb854cdc90461d1ea9397ab3",
  [string]$BackendUrl = "https://pappspypbd.us-east-2.awsapprunner.com",
  [string]$BackendTag = "",
  [string]$FrontendTag = "",
  [switch]$SkipBackend,
  [switch]$SkipFrontend
)

$ErrorActionPreference = "Stop"
$env:AWS_PAGER = ""

function Write-Step {
  param([string]$Message)
  Write-Host "\n==> $Message" -ForegroundColor Cyan
}

function Ensure-Command {
  param([string]$Name)
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "No se encontro el comando '$Name'. Instala la herramienta y vuelve a intentar."
  }
}

function Ensure-Docker {
  try {
    docker version | Out-Null
  }
  catch {
    throw "Docker no esta corriendo. Inicia Docker Desktop y vuelve a ejecutar este script."
  }
}

function Ensure-Path {
  param(
    [string]$Path,
    [string]$Name
  )
  if (-not (Test-Path -Path $Path)) {
    throw "No se encontro la ruta de ${Name}: $Path"
  }
}

function Invoke-WithRetry {
  param(
    [scriptblock]$Action,
    [string]$OperationName,
    [int]$MaxAttempts = 3,
    [int]$DelaySeconds = 8
  )

  for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {
    try {
      & $Action
      return
    }
    catch {
      if ($attempt -ge $MaxAttempts) {
        throw "${OperationName} fallo despues de $MaxAttempts intentos. Error: $($_.Exception.Message)"
      }

      Write-Host "${OperationName} fallo en intento ${attempt}/${MaxAttempts}. Reintentando en ${DelaySeconds}s..." -ForegroundColor Yellow
      Start-Sleep -Seconds $DelaySeconds
    }
  }
}

function Get-AppRunnerStatus {
  param([string]$ServiceArn)
  return (aws apprunner describe-service --service-arn $ServiceArn --region $Region --query "Service.Status" --output text).Trim()
}

function Wait-AppRunnerStatus {
  param(
    [string]$ServiceArn,
    [string[]]$TargetStatuses,
    [int]$TimeoutSeconds = 300,
    [int]$PollIntervalSeconds = 5
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    $currentStatus = Get-AppRunnerStatus -ServiceArn $ServiceArn
    Write-Host "Estado App Runner ($ServiceArn): $currentStatus" -ForegroundColor DarkGray

    if ($TargetStatuses -contains $currentStatus) {
      return $currentStatus
    }

    Start-Sleep -Seconds $PollIntervalSeconds
  }

  throw "Timeout esperando estado [$($TargetStatuses -join ',')] para el servicio: ${ServiceArn}"
}

function Resume-AppRunnerService {
  param([string]$ServiceArn)

  $status = Get-AppRunnerStatus -ServiceArn $ServiceArn
  if ($status -eq "PAUSED") {
    Write-Host "Servicio en PAUSED. Reanudando: $ServiceArn" -ForegroundColor Yellow
    aws apprunner resume-service --service-arn $ServiceArn --region $Region | Out-Null
    Wait-AppRunnerStatus -ServiceArn $ServiceArn -TargetStatuses @("RUNNING") | Out-Null
    return
  }

  if ($status -eq "OPERATION_IN_PROGRESS") {
    Write-Host "Servicio en OPERATION_IN_PROGRESS. Esperando a RUNNING: ${ServiceArn}" -ForegroundColor Yellow
    Wait-AppRunnerStatus -ServiceArn $ServiceArn -TargetStatuses @("RUNNING") | Out-Null
    return
  }

  Write-Host "Servicio listo con estado ${status}: ${ServiceArn}" -ForegroundColor DarkGray
}

function Update-AppRunnerImage {
  param(
    [string]$ServiceArn,
    [string]$ImageIdentifier,
    [string]$ServiceName
  )

  Write-Host "Actualizando imagen de ${ServiceName}: $ImageIdentifier" -ForegroundColor Yellow

  $serviceDetails = aws apprunner describe-service --service-arn $ServiceArn --region $Region --output json | ConvertFrom-Json
  $sourceConfiguration = $serviceDetails.Service.SourceConfiguration

  if (-not $sourceConfiguration -or -not $sourceConfiguration.ImageRepository) {
    throw "No se pudo obtener ImageRepository para ${ServiceName}."
  }

  $sourceConfiguration.ImageRepository.ImageIdentifier = $ImageIdentifier

  $payload = [ordered]@{
    ServiceArn = $ServiceArn
    SourceConfiguration = $sourceConfiguration
  }

  $tempFile = [System.IO.Path]::GetTempFileName()
  try {
    $payload | ConvertTo-Json -Depth 30 | Set-Content -Path $tempFile -Encoding UTF8
    aws apprunner update-service --region $Region --cli-input-json "file://$tempFile" | Out-Null
    Wait-AppRunnerStatus -ServiceArn $ServiceArn -TargetStatuses @("RUNNING") -TimeoutSeconds 900 | Out-Null
  }
  finally {
    if (Test-Path $tempFile) {
      Remove-Item $tempFile -Force
    }
  }
}

Ensure-Command "aws"
Ensure-Command "docker"
Ensure-Docker

if ([string]::IsNullOrWhiteSpace($BackendTag)) {
  $BackendTag = "back-$(Get-Date -Format yyyyMMdd-HHmm)"
}

if ([string]::IsNullOrWhiteSpace($FrontendTag)) {
  $FrontendTag = "front-$(Get-Date -Format yyyyMMdd-HHmm)"
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendPath = Join-Path $PSScriptRoot "back"
$frontendPath = Join-Path $PSScriptRoot "front\files"

if (-not $SkipBackend) { Ensure-Path -Path $backendPath -Name "backend" }
if (-not $SkipFrontend) { Ensure-Path -Path $frontendPath -Name "frontend" }

$backendEcrImage = "$AccountId.dkr.ecr.$Region.amazonaws.com/${BackendRepo}:$BackendTag"
$frontendEcrImage = "$AccountId.dkr.ecr.$Region.amazonaws.com/${FrontendRepo}:$FrontendTag"

Write-Step "Validando identidad AWS"
aws sts get-caller-identity --query "{Account:Account,Arn:Arn}" --output table

Write-Step "Login en ECR"
aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin "$AccountId.dkr.ecr.$Region.amazonaws.com"

try {
  if (-not $SkipBackend) {
    Write-Step "Build backend: ${BackendRepo}:$BackendTag"
    Set-Location $backendPath
    docker build --no-cache -t "$BackendRepo`:$BackendTag" .

    Write-Step "Tag + push backend a ECR"
    docker tag "$BackendRepo`:$BackendTag" $backendEcrImage
    Invoke-WithRetry -OperationName "Push backend a ECR" -Action {
      docker push $backendEcrImage
      if ($LASTEXITCODE -ne 0) {
        throw "docker push backend devolvio codigo $LASTEXITCODE"
      }
    }
  }

  if (-not $SkipFrontend) {
    Write-Step "Build frontend: ${FrontendRepo}:$FrontendTag"
    Set-Location $frontendPath
    docker build --no-cache --build-arg "NEXT_PUBLIC_API_URL=$BackendUrl" -t "$FrontendRepo`:$FrontendTag" .

    Write-Step "Tag + push frontend a ECR"
    docker tag "$FrontendRepo`:$FrontendTag" $frontendEcrImage
    Invoke-WithRetry -OperationName "Push frontend a ECR" -Action {
      docker push $frontendEcrImage
      if ($LASTEXITCODE -ne 0) {
        throw "docker push frontend devolvio codigo $LASTEXITCODE"
      }
    }
  }

  Write-Step "Reanudando servicios App Runner si estan pausados"
  if (-not $SkipBackend) { Resume-AppRunnerService -ServiceArn $BackendServiceArn }
  if (-not $SkipFrontend) { Resume-AppRunnerService -ServiceArn $FrontendServiceArn }

  Write-Step "Actualizando imagenes en App Runner"
  if (-not $SkipBackend) {
    Update-AppRunnerImage -ServiceArn $BackendServiceArn -ImageIdentifier $backendEcrImage -ServiceName "backend"
    Write-Host "Backend actualizado con imagen: $backendEcrImage" -ForegroundColor Green
  }

  if (-not $SkipFrontend) {
    Update-AppRunnerImage -ServiceArn $FrontendServiceArn -ImageIdentifier $frontendEcrImage -ServiceName "frontend"
    Write-Host "Frontend actualizado con imagen: $frontendEcrImage" -ForegroundColor Green
  }
}
finally {
  Set-Location $repoRoot
}

Write-Step "Resumen"
if (-not $SkipBackend) { Write-Host "Backend tag:  $BackendTag" -ForegroundColor White }
if (-not $SkipFrontend) { Write-Host "Frontend tag: $FrontendTag" -ForegroundColor White }
Write-Host "Frontend URL: https://win4nmi2ap.us-east-2.awsapprunner.com" -ForegroundColor White
Write-Host "Backend URL:  https://pappspypbd.us-east-2.awsapprunner.com" -ForegroundColor White
Write-Host "Verifica estado: aws apprunner list-services --region $Region" -ForegroundColor White
