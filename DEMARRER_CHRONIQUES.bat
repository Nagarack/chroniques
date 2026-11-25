@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
title Chroniques - Serveur MJ
where node >nul 2>&1
if errorlevel 1 (
 echo ERREUR : Node.js absent - https://nodejs.org/
 pause
 exit /b 1
)
echo.
echo =====================================
for /f "delims=" %%v in ('node -p "require('./package.json').version"') do echo       Chroniques %%v
echo =====================================
echo.
if exist "config\remote-origin.txt" (
 echo Mode HTTPS Cloudflare Tunnel configure :
 type "config\remote-origin.txt"
 echo.
 echo Le tunnel doit aussi etre ACTIF dans Cloudflare.
 echo ATTENTION : connexion locale HTTP refusee quand le mode HTTPS est configure.
) else (
 echo Mode local - http://127.0.0.1:8080/
 echo Creez votre compte MJ en local AVANT de publier l'application.
)
echo.
echo Laissez cette fenetre ouverte pendant les parties. Ctrl+C pour arreter.
rem Bloc lu en entier avant execution : une mise a jour peut remplacer ce fichier sans risque.
(
 node scripts\launcher.js
 if errorlevel 1 echo Echec de demarrage du serveur.
 pause
 exit /b
)
