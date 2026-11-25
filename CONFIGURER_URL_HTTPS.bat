@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
title Chroniques V0.8 - Adresse publique HTTPS
where node >nul 2>&1
if errorlevel 1 (
 echo ERREUR : installez Node.js depuis https://nodejs.org/
 pause
 exit /b 1
)
echo.
echo ETAPE 1 : creez d'abord un compte MJ en mode LOCAL.
echo ETAPE 2 : dans Cloudflare, creez un TUNNEL vers http://127.0.0.1:8080
 echo ETAPE 3 : ajoutez un NOM DE DOMAINE HTTPS permanent (route publique).
echo Ne collez JAMAIS le jeton du tunnel ici.
echo.
set /p "URL=Quelle est l'adresse HTTPS publique de Chroniques (https://app.domaine.fr) ? "
node scripts\set-remote-origin.js "%URL%"
if errorlevel 1 echo Configuration non modifiee.
echo.
echo Redemarrez DEMARRER_CHRONIQUES.bat.
pause
