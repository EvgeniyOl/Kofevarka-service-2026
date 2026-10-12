# ============================================================
#  Подготовка Windows к Docker и запуск базы
#
#  Запускать через setup-docker.cmd (он сам запросит права
#  администратора). Можно и напрямую:
#    powershell -ExecutionPolicy Bypass -File scripts\setup-docker.ps1
#
#  Скрипт можно запускать повторно: каждый шаг проверяет,
#  не сделано ли уже то, что он собирается сделать.
# ============================================================

[CmdletBinding()]
param(
  # Пропустить перезагрузку в конце первого этапа
  [switch]$NoRestart
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot

function Write-Step($text) { Write-Host "`n=== $text ===" -ForegroundColor Cyan }
function Write-Ok($text) { Write-Host "  ок  $text" -ForegroundColor Green }
function Write-Warn($text) { Write-Host "  !   $text" -ForegroundColor Yellow }
function Write-Fail($text) { Write-Host "  ОШИБКА: $text" -ForegroundColor Red }

function Test-Admin {
  $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
  (New-Object Security.Principal.WindowsPrincipal($identity)).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator
  )
}

if (-not (Test-Admin)) {
  Write-Fail 'Нужны права администратора. Запустите setup-docker.cmd — он запросит их сам.'
  Read-Host 'Нажмите Enter, чтобы закрыть'
  exit 1
}

Write-Host @'

============================================================
  Подготовка системы к Docker и запуск базы
============================================================
'@ -ForegroundColor White

# --- Этап 1: компоненты Windows ---
Write-Step 'Этап 1. Компоненты Windows для Docker'

$features = @{
  'Microsoft-Windows-Subsystem-Linux' = 'Подсистема Windows для Linux'
  'VirtualMachinePlatform'            = 'Платформа виртуальных машин'
}

$needRestart = $false
foreach ($name in $features.Keys) {
  $feature = Get-WindowsOptionalFeature -Online -FeatureName $name -ErrorAction SilentlyContinue
  if (-not $feature) {
    Write-Warn "компонент $name не найден в системе"
    continue
  }

  if ($feature.State -eq 'Enabled') {
    Write-Ok "$($features[$name]): уже включён"
    continue
  }

  Write-Host "  включаю: $($features[$name])..."
  $result = Enable-WindowsOptionalFeature -Online -FeatureName $name -All -NoRestart
  if ($result.RestartNeeded) { $needRestart = $true }
  Write-Ok "$($features[$name]): включён"
}

# --- WSL ---
Write-Step 'Этап 2. Основа WSL'

$wslStatus = & wsl.exe --status 2>&1 | Out-String
if ($LASTEXITCODE -eq 0 -and $wslStatus -notmatch 'не установлен|not installed') {
  Write-Ok 'WSL уже установлен'
} else {
  Write-Host '  устанавливаю основу WSL (без Linux-дистрибутива)...'
  & wsl.exe --install --no-distribution 2>&1 | ForEach-Object { "    $_" }
  if ($LASTEXITCODE -ne 0) {
    Write-Warn "wsl --install вернул код $LASTEXITCODE — обычно это значит, что компоненты уже включены"
  } else {
    Write-Ok 'WSL установлен'
    $needRestart = $true
  }
}

# --- Перезагрузка, если нужна ---
if ($needRestart) {
  Write-Host @'

============================================================
  НУЖНА ПЕРЕЗАГРУЗКА
============================================================

  Сохраните открытые документы и перезагрузите компьютер,
  затем запустите setup-docker.cmd снова — скрипт продолжит
  со следующего шага и установит Docker Desktop.

'@ -ForegroundColor Yellow

  if ($NoRestart) {
    Write-Warn 'Перезагрузка пропущена (ключ -NoRestart). Перезагрузите компьютер вручную.'
  } else {
    $answer = Read-Host '  Перезагрузить сейчас? (д/н)'
    if ($answer -match '^(д|y|да|yes)$') {
      Write-Host '  Перезагрузка через 30 секунд. Отменить: shutdown /a' -ForegroundColor Yellow
      shutdown /r /t 30 /c 'Подготовка к Docker: нужна перезагрузка'
    } else {
      Write-Warn 'Перезагрузите компьютер вручную и запустите скрипт снова.'
    }
  }
  Read-Host 'Нажмите Enter, чтобы закрыть'
  exit 0
}

# --- Этап 3: Docker Desktop ---
Write-Step 'Этап 3. Docker Desktop'

$docker = Get-Command docker -ErrorAction SilentlyContinue
if ($docker) {
  Write-Ok 'Docker уже установлен'
} else {
  Write-Host '  Docker не найден, устанавливаю через winget (5-15 минут)...'
  $winget = Get-Command winget -ErrorAction SilentlyContinue
  if (-not $winget) {
    Write-Fail 'winget не найден. Установите Docker Desktop вручную: https://www.docker.com/products/docker-desktop/'
    Read-Host 'Нажмите Enter, чтобы закрыть'
    exit 1
  }

  & winget install --id Docker.DockerDesktop -e --accept-package-agreements --accept-source-agreements
  if ($LASTEXITCODE -ne 0) {
    Write-Fail 'winget не смог установить Docker Desktop. Скачайте вручную и запустите скрипт снова.'
    Read-Host 'Нажмите Enter, чтобы закрыть'
    exit 1
  }
  Write-Ok 'Docker Desktop установлен'
}

# --- Запуск движка ---
Write-Step 'Этап 4. Запуск движка Docker'

$dockerInfo = & docker info 2>&1 | Out-String
if ($LASTEXITCODE -ne 0) {
  $desktop = Join-Path $env:ProgramFiles 'Docker\Docker\Docker Desktop.exe'
  if (Test-Path $desktop) {
    Write-Host '  запускаю Docker Desktop...'
    Start-Process -FilePath $desktop
  } else {
    Write-Warn 'не нашёл Docker Desktop.exe — запустите его вручную из меню Пуск'
  }

  Write-Host '  жду готовности движка (до 5 минут)...'
  $ready = $false
  for ($i = 0; $i -lt 60; $i++) {
    Start-Sleep -Seconds 5
    & docker info *> $null
    if ($LASTEXITCODE -eq 0) { $ready = $true; break }
    Write-Host '.' -NoNewline
  }
  Write-Host ''

  if (-not $ready) {
    Write-Fail 'движок Docker не запустился. Откройте Docker Desktop, дождитесь зелёного значка «Engine running» и запустите скрипт снова.'
    Read-Host 'Нажмите Enter, чтобы закрыть'
    exit 1
  }
}
Write-Ok 'движок Docker работает'

# --- База данных ---
Write-Step 'Этап 5. База данных в контейнере'

Push-Location $projectRoot
try {
  & docker compose up -d
  if ($LASTEXITCODE -ne 0) {
    Write-Fail "не удалось запустить базу. Проверьте, что docker-compose.yml на месте: $projectRoot"
    exit 1
  }

  Write-Host '  жду готовности базы...'
  $dbReady = $false
  for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 5
    & docker compose exec -T db pg_isready -U kofevarka -d kofevarka *> $null
    if ($LASTEXITCODE -eq 0) { $dbReady = $true; break }
    Write-Host '.' -NoNewline
  }
  Write-Host ''

  if (-not $dbReady) {
    Write-Fail 'база не ответила за 2,5 минуты. Посмотрите логи: npm run db:logs'
    exit 1
  }
  Write-Ok 'база принимает подключения'

  # --- Переменные окружения ---
  Write-Step 'Этап 6. Файл .env.local'

  $envPath = Join-Path $projectRoot '.env.local'
  if (Test-Path $envPath) {
    Write-Ok '.env.local уже есть — не трогаю, чтобы не потерять ваши значения'
  } else {
    $secret = & node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
    if (-not $secret) {
      Write-Fail 'не удалось сгенерировать секрет: проверьте, что Node.js установлен'
      exit 1
    }

    $lines = @(
      '# Локальная база в Docker. Файл в .gitignore, в репозиторий не попадает.',
      'DATABASE_URL=postgresql://kofevarka:kofevarka@localhost:5433/kofevarka',
      "SESSION_SECRET=$secret"
    )
    # UTF-8 без BOM: с BOM первая переменная читается с лишним символом
    [IO.File]::WriteAllLines($envPath, $lines, (New-Object Text.UTF8Encoding($false)))
    Write-Ok '.env.local создан: строка подключения и новый секрет сессии'
  }
} finally {
  Pop-Location
}

Write-Host @'

============================================================
  ГОТОВО. База работает.
============================================================

  Дальше:
    npm run dev
  и откройте http://localhost:5000/register

  Первый зарегистрированный пользователь становится администратором.

  Полезные команды:
    npm run db:logs   — логи базы
    npm run db:down   — остановить базу
    npm run db:up     — запустить снова
    npm run db:reset  — остановить и стереть данные

'@ -ForegroundColor Green

Read-Host 'Нажмите Enter, чтобы закрыть'
