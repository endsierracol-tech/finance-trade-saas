@echo off
title Finance Trade — Regenerar cliente Prisma
cd /d "%~dp0"
echo Regenerando cliente Prisma (tipos TypeScript)...
echo.
call npm run db:generate
echo.
echo ============================================
echo  Listo. Ahora ejecuta DEV.bat para iniciar.
echo ============================================
pause
