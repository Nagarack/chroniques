@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Tests Chroniques
where node >nul 2>&1
if errorlevel 1 (
 echo ERREUR : Node.js doit etre installe pour lancer les tests.
 pause
 exit /b 1
)
node --test
pause
