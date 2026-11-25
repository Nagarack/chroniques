@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
title Chroniques - Recuperation des donnees
echo CHRONIQUES - RECUPERATION DES DONNEES
echo ----------------------------------------------------
echo Fermez l'ancien serveur et sauvegardez votre ancienne version avant la migration.
echo Conservez TOUJOURS votre ancien dossier intact.
echo.
if exist "data\chroniques-db.json" (
 echo SECURITE : une base existe deja dans ce dossier. Aucun remplacement.
 echo Decompressez la nouvelle version dans un dossier vide.
 pause
 exit /b 1
)
set /p "OLD=Chemin complet de l'ANCIEN dossier qui contient server.js : "
set "OLD=%OLD:"=%"
if not exist "%OLD%\server.js" (
 echo ERREUR : server.js non trouve dans ce dossier.
 pause
 exit /b 1
)
if not exist "%OLD%\data\chroniques-db.json" (
 echo ERREUR : base non trouvee dans l'ancien dossier.
 pause
 exit /b 1
)
if not exist "data" mkdir "data"
copy /-Y "%OLD%\data\chroniques-db.json" "data\chroniques-db.json" >nul
if errorlevel 1 (
 echo ERREUR : copie de la base impossible. Arret.
 pause
 exit /b 1
)
echo Base de donnees copiee.
if exist "%OLD%\config\remote-origin.txt" (
 if not exist "config" mkdir "config"
 if not exist "config\remote-origin.txt" (
  copy /-Y "%OLD%\config\remote-origin.txt" "config\remote-origin.txt" >nul
  if errorlevel 1 echo ATTENTION : copier manuellement la configuration HTTPS.
  if not errorlevel 1 echo Configuration HTTPS copiee.
 )
)
if exist "%OLD%\data\media" (
 if not exist "data\media" mkdir "data\media"
 xcopy "%OLD%\data\media\*" "data\media\" /E /I /Y >nul
 if errorlevel 1 echo ATTENTION : verifier la copie des images dans data\media.
 if not errorlevel 1 echo Images et fonds de carte copies.
)
echo.
echo TERMINE : ouvrez DEMARRER_CHRONIQUES.bat dans ce dossier.
echo Controlez vos personnages et vos cartes avant de supprimer quoi que ce soit.
pause
