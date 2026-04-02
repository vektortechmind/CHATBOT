# Inicia backend de forma síncrona e mostra todos os logs
Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   BACKEND STARTUP - Debug Mode        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Set-Location $PSScriptRoot

# Limpar porta
Write-Host "[1] Limpando porta 3000..." -ForegroundColor Yellow
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | 
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
Start-Sleep -Seconds 1

# Ir para backend
Push-Location "backend"

# Preparar Prisma
Write-Host "[2] Gerando Prisma..." -ForegroundColor Yellow
npx prisma generate

Write-Host "[3] Pushando banco de dados..." -ForegroundColor Yellow
npx prisma db push --skip-generate --accept-data-loss

Write-Host ""
Write-Host "[4] Iniciando npm run dev..." -ForegroundColor Green
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Executar npm run dev de forma síncrona (sem nova janela)
# Todos os logs aparecerão aqui
npm run dev

Pop-Location

