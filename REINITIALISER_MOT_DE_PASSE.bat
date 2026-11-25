@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
title Chroniques - Mot de passe oublie
where node >nul 2>&1
if errorlevel 1 (
 echo ERREUR : Node.js est requis - https://nodejs.org/
 pause
 exit /b 1
)
echo CHRONIQUES - MOT DE PASSE OUBLIE
echo ----------------------------------------------------
echo Fermez d abord la fenetre du serveur Chroniques.
echo Ce script cree un lien a usage unique pour choisir un nouveau mot de passe.
echo.
node scripts\reset-password.js
echo.
pause
