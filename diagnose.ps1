Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  DIAGNOSTICO DO BACKEND" -ForegroundColor White
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar se porta 3000 esta livre
Write-Host "[1] Verificando porta 3000..." -ForegroundColor Yellow
$portInUse = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($portInUse) {
  Write-Host "     [OCUPADA] Processo ID: $($portInUse.OwningProcess)" -ForegroundColor Red
  Write-Host "     Matando processo..." -ForegroundColor Yellow
  Stop-Process -Id $portInUse.OwningProcess -Force -ErrorAction SilentlyContinue
  Start-Sleep -Seconds 2
} else {
  Write-Host "     [LIVRE] OK" -ForegroundColor Green
}
Write-Host ""

# 2. Verificar arquivo .env
Write-Host "[2] Verificando arquivo backend\.env..." -ForegroundColor Yellow
$envFile = "backend\.env"
if (Test-Path $envFile) {
  Write-Host "     [EXISTE] OK" -ForegroundColor Green
  Write-Host "     Conteudo:" -ForegroundColor DarkGray
  Get-Content $envFile | ForEach-Object { Write-Host "       $_" -ForegroundColor DarkGray }
} else {
  Write-Host "     [ERRO] Arquivo nao encontrado: $envFile" -ForegroundColor Red
  exit 1
}
Write-Host ""

# 3. Verificar node_modules
Write-Host "[3] Verificando dependencias (backend\node_modules)..." -ForegroundColor Yellow
if (Test-Path "backend\node_modules") {
  Write-Host "     [EXISTE] OK" -ForegroundColor Green
} else {
  Write-Host "     [AVISO] node_modules nao encontrado, rodando npm install..." -ForegroundColor Yellow
  Push-Location "backend"
  npm install 2>&1 | Select-Object -Last 5
  Pop-Location
}
Write-Host ""

# 4. Tentar iniciar backend
Write-Host "[4] Iniciando backend diretamente (npm run dev)..." -ForegroundColor Yellow
Write-Host "     (Ctrl+C para parar)" -ForegroundColor DarkGray
Write-Host ""
Push-Location "backend"
npm run dev
Pop-Location
