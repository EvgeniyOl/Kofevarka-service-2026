@echo off
rem ============================================================
rem  Установка Docker и запуск базы данных
rem
rem  Просто дважды кликните по этому файлу и подтвердите запрос
rem  прав администратора (UAC).
rem
rem  Что произойдёт:
rem    1. включатся компоненты Windows, нужные Docker;
rem    2. если потребуется — компьютер предложит перезагрузиться,
rem       после перезагрузки запустите этот файл снова;
rem    3. установится Docker Desktop (5-15 минут);
rem    4. поднимется база и создастся файл .env.local.
rem
rem  Скрипт можно запускать повторно: уже сделанные шаги пропускаются.
rem ============================================================

setlocal
set "SCRIPT=%~dp0setup-docker.ps1"

rem Проверяем права администратора и при необходимости перезапускаем себя с ними
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Zaprashivayu prava administratora...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

title Ustanovka Docker i bazy dannyh

powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT%"
set "CODE=%errorlevel%"

if not "%CODE%"=="0" (
    echo.
    echo Skript zavershilsya s kodom %CODE%.
    echo Prishlite etot tekst razrabotchiku.
    pause
)

endlocal
