@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
title Chroniques - Cloudflare Access
where node >nul 2>&1
if errorlevel 1 (
 echo Installez Node.js depuis https://nodejs.org/
 pause
 exit /b 1
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\configurer-cloudflare-access.ps1"
if errorlevel 1 echo Consultez le message d'erreur et verifiez dans Cloudflare.
pause
