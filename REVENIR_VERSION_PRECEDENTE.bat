@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
title Chroniques - Retour a la version precedente
where node >nul 2>&1
if errorlevel 1 (
 echo ERREUR : Node.js est requis - https://nodejs.org/
 pause
 exit /b 1
)
echo CHRONIQUES - RETOUR A LA VERSION PRECEDENTE
echo ----------------------------------------------------
echo Remet en place la version installee avant la derniere mise a jour.
echo Vos donnees (data, config, backups) ne sont pas modifiees.
echo Fermez d abord la fenetre du serveur Chroniques.
echo.
pause
(
 node "%~dp0scripts\update.js" --rollback
 echo.
 pause
 exit /b
)
