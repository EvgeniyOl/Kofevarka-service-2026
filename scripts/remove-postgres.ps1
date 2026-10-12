# ============================================================
#  Удаление локального PostgreSQL
#
#  Нужно, чтобы освободить порт 5432 и вернуть место на диске.
#  База пуста — в ней только стандартные template0, template1
#  и postgres, пользовательских данных нет.
#
#  Запускать через remove-postgres.cmd (сам запросит права).
# ============================================================

[CmdletBinding()]
param(
  # Оставить pgAdmin 4 (по умолчанию удаляется вместе с сервером)
  [switch]$KeepPgAdmin
)

$ErrorActionPreference = 'Stop'

function Write-Step($text) { Write-Host "`n=== $text ===" -ForegroundColor Cyan }
function Write-Ok($text) { Write-Host "  ок  $text" -ForegroundColor Green }
function Write-Warn($text) { Write-Host "  !   $text" -ForegroundColor Yellow }
function Write-Fail($text) { Write-Host "  ОШИБКА: $text" -ForegroundColor Red }

$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$isAdmin = (New-Object Security.Principal.WindowsPrincipal($identity)).IsInRole(
  [Security.Principal.WindowsBuiltInRole]::Administrator
)

if (-not $isAdmin) {
  Write-Fail 'Нужны права администратора. Запустите remove-postgres.cmd — он запросит их сам.'
  Read-Host 'Нажмите Enter, чтобы закрыть'
  exit 1
}

Write-Host @'

============================================================
  Удаление локального PostgreSQL
============================================================
'@ -ForegroundColor White

# --- Что нашли в системе ---
Write-Step 'Что установлено'

$installs = Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*' -ErrorAction SilentlyContinue |
  Where-Object { $_.DisplayName -like 'PostgreSQL*' }

if (-not $installs) {
  Write-Warn 'PostgreSQL в списке установленных программ не найден.'
  Write-Host '  Возможно, он уже удалён.'
} else {
  foreach ($item in $installs) {
    Write-Host "  $($item.DisplayName) — версия $($item.DisplayVersion)"
    Write-Host "  папка: $($item.InstallLocation)"
  }
}

# --- Останавливаем службы ---
Write-Step 'Остановка служб'

$services = Get-Service -ErrorAction SilentlyContinue | Where-Object { $_.Name -like 'postgresql*' }
if (-not $services) {
  Write-Ok 'служб PostgreSQL нет'
} else {
  foreach ($service in $services) {
    Write-Host "  останавливаю $($service.Name)..."
    try {
      Stop-Service -Name $service.Name -Force -ErrorAction Stop
      Write-Ok "$($service.Name) остановлена"
    } catch {
      Write-Warn "не удалось остановить $($service.Name): $($_.Exception.Message.Split([Environment]::NewLine)[0])"
    }
  }
}

# --- Закрываем pgAdmin, если открыт: он мешает удалению файлов ---
$pgAdmin = Get-Process -Name 'pgAdmin4' -ErrorAction SilentlyContinue
if ($pgAdmin) {
  Write-Host '  закрываю pgAdmin 4 — он мешает удалению файлов'
  $pgAdmin | Stop-Process -Force -ErrorAction SilentlyContinue
  Start-Sleep -Seconds 2
}

# --- Удаление ---
Write-Step 'Удаление PostgreSQL'

foreach ($item in $installs) {
  $uninstaller = $item.UninstallString -replace '^"|"$', ''
  if (-not (Test-Path $uninstaller)) {
    Write-Warn "деинсталлятор не найден: $uninstaller"
    continue
  }

  Write-Host "  запускаю: $uninstaller"
  Write-Host '  удаление занимает несколько минут, окно не закрывайте...'

  # EDB-инсталлятор требует пароль суперпользователя даже при удалении;
  # в тихом режиме подставляем заглушку — база всё равно удаляется.
  $arguments = @('--mode', 'unattended', '--unattendedmodeui', 'none', '--superpassword', 'unused')
  $process = Start-Process -FilePath $uninstaller -ArgumentList $arguments -Wait -PassThru
  Write-Host "  деинсталлятор завершился с кодом $($process.ExitCode)"
}

# --- Если деинсталлятор не справился, служба могла остаться ---
Start-Sleep -Seconds 3
$leftover = Get-Service -ErrorAction SilentlyContinue | Where-Object { $_.Name -like 'postgresql*' }
if ($leftover) {
  Write-Warn 'служба осталась — удаляю вручную'
  foreach ($service in $leftover) {
    & sc.exe delete $service.Name | Out-Null
    Write-Ok "служба $($service.Name) удалена"
  }
}

# --- Остатки файлов ---
Write-Step 'Остатки на диске'

$leftoverPaths = @('C:\Program Files\PostgreSQL')
foreach ($path in $leftoverPaths) {
  if (Test-Path $path) {
    $size = (Get-ChildItem $path -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
    Write-Warn "$path осталась ($([math]::Round($size / 1MB)) МБ)"

    if ($KeepPgAdmin) {
      Write-Host '  ключ -KeepPgAdmin: папку не трогаю'
    } else {
      Write-Host '  удаляю папку...'
      Remove-Item $path -Recurse -Force -ErrorAction SilentlyContinue
      if (Test-Path $path) {
        Write-Warn "не удалось удалить полностью: $path — проверьте вручную"
      } else {
        Write-Ok "$path удалена"
      }
    }
  } else {
    Write-Ok 'папка Program Files\PostgreSQL удалена'
  }
}

# --- Итог ---
Write-Step 'Проверка результата'

$portBusy = (netstat -ano | Select-String ':5432\s+.*LISTENING') -ne $null
if ($portBusy) {
  Write-Warn 'порт 5432 всё ещё занят — возможно, нужна перезагрузка'
} else {
  Write-Ok 'порт 5432 свободен'
}

$stillThere = Get-Service -ErrorAction SilentlyContinue | Where-Object { $_.Name -like 'postgresql*' }
if ($stillThere) {
  Write-Warn "остались службы: $($stillThere.Name -join ', ')"
} else {
  Write-Ok 'служб PostgreSQL не осталось'
}

$psql = Get-Command psql -ErrorAction SilentlyContinue
if ($psql) {
  Write-Warn "команда psql всё ещё доступна: $($psql.Source) — возможно, в PATH осталась старая запись"
} else {
  Write-Ok 'команда psql больше не находится'
}

Write-Host @'

============================================================
  ГОТОВО
============================================================

  Порт 5432 свободен, место на диске возвращено.

  Дальше можно ставить Docker: scripts\setup-docker.cmd
  База для проекта будет работать в контейнере на порту 5433.

'@ -ForegroundColor Green

Read-Host 'Нажмите Enter, чтобы закрыть'
