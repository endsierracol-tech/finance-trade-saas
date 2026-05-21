@echo off
title Finance Trade — Instalar adaptador PostgreSQL
cd /d "%~dp0"
echo Instalando @prisma/adapter-pg y pg...
echo.
call npm install @prisma/adapter-pg pg @types/pg
echo.
echo ============================================
echo  Listo. Ahora ejecuta DEV.bat para iniciar.
echo ============================================
pause
