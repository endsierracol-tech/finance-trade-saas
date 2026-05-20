@echo off
title Finance Trade — Dev Server
cd /d "%~dp0"
echo.
echo  Iniciando Finance Trade...
echo.
start "" cmd /k "cd /d "%~dp0" && npm run dev"
timeout /t 4 /nobreak >nul
start "" "http://localhost:3000"
