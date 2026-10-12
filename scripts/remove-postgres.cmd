@echo off
rem ============================================================
rem  Udalit lokalnyy PostgreSQL
rem
rem  Dvazhdy kliknite po etomu faylu i podtverdite zapros prav
rem  administratora (UAC).
rem
rem  Chto proizoydet:
rem    1. ostanovyatsya sluzhby PostgreSQL;
rem    2. zapustitsya shtatnyy deinstallyator i udalit server;
rem    3. osvoboditsya port 5432 i vernyotsya mesto na diske.
rem
rem  Dannyh v baze net: tolko standartnye template0, template1,
rem  postgres. Poteryat nechego.
rem ============================================================

setlocal
set "SCRIPT=%~dp0remove-postgres.ps1"

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Zaprashivayu prava administratora...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

title Udalenie PostgreSQL

powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT%"
set "CODE=%errorlevel%"

if not "%CODE%"=="0" (
    echo.
    echo Skript zavershilsya s kodom %CODE%.
    echo Prishlite etot tekst razrabotchiku.
    pause
)

endlocal
