@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
title Chroniques - Verification beta testeurs
where node >nul 2>&1
if errorlevel 1 (
 echo ERREUR : installer Node.js 20 ou plus avant la demonstration.
 pause
 exit /b 1
)
node scripts\preflight-beta.js
if errorlevel 1 (
 echo ERREUR : controle avant test echoue. Ne modifiez pas la base sans sauvegarde.
 pause
 exit /b 1
)
echo.
echo Verification des tests logiciels...
node --test
if errorlevel 1 (
 echo ERREUR : certains tests ont echoue. Conserver les logs pour diagnostic.
 pause
 exit /b 1
)
echo.
echo BETA VALIDEE COTE TESTS. Verifier ensuite Windows, mobiles et Cloudflare.
pause
