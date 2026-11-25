@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
title Chroniques - Mise a jour
where node >nul 2>&1
if errorlevel 1 (
 echo ERREUR : Node.js est requis - https://nodejs.org/
 pause
 exit /b 1
)
echo CHRONIQUES - MISE A JOUR
echo ----------------------------------------------------
echo Vos campagnes, comptes, images et reglages sont conserves.
echo Une sauvegarde est faite avant toute modification,
echo et la version actuelle est remise en place si quelque chose echoue.
echo.
echo 1. Fermez la fenetre du serveur Chroniques si elle est ouverte.
echo 2. Glissez le fichier ZIP de la nouvelle version sur ce fichier,
echo    ou collez son chemin ci-dessous.
echo.
set "SRC=%~1"
if not defined SRC set /p "SRC=Chemin du fichier ZIP (ou glissez-le ici) puis Entree : "
if defined SRC set "SRC=%SRC:"=%"
rem Le bloc suivant est lu en entier avant execution : la mise a jour peut remplacer ce fichier sans risque.
(
 node "%~dp0scripts\update.js" "%SRC%"
 echo.
 pause
 exit /b
)
