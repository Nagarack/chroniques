@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Chroniques - Sauvegarde de la campagne
where node >nul 2>&1
if errorlevel 1 (
 echo Node.js est requis.
 pause
 exit /b 1
)
node scripts\backup.js
pause
