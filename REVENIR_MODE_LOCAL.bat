@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
title Chroniques V0.8 - Mode local
 echo IMPORTANT : ce script supprime SEULEMENT l'URL Chroniques locale.
echo Il ne desactive PAS le tunnel public chez Cloudflare.
echo Pour couper l'acces Internet : desactivez la route/le tunnel dans Cloudflare.
echo.
set /p "OK=Revenir au mode local (O/N) ? "
if /I not "%OK%"=="O" exit /b 0
node scripts\set-remote-origin.js --off
if errorlevel 1 echo Configuration non modifiee.
echo Redemarrez Chroniques, puis utilisez http://127.0.0.1:8080/
pause
