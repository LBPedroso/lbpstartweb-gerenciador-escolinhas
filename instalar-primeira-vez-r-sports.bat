@echo off
setlocal
cd /d "%~dp0"

echo =========================================
echo R Sports - Instalacao inicial
echo =========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERRO] Node.js nao encontrado.
  echo Instale o Node.js LTS: https://nodejs.org/
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERRO] npm nao encontrado.
  echo Reinstale o Node.js LTS: https://nodejs.org/
  pause
  exit /b 1
)

echo [1/4] Instalando dependencias...
call npm install
if errorlevel 1 goto :fail

echo [2/4] Gerando cliente Prisma...
call npx prisma generate
if errorlevel 1 goto :fail

echo [3/4] Aplicando migrations...
call npx prisma migrate deploy
if errorlevel 1 goto :fail

echo [4/4] Populando base com dados iniciais...
call npm run db:seed
if errorlevel 1 goto :fail

echo.
echo Instalacao concluida com sucesso.
echo Agora use o arquivo abrir-r-sports.bat para abrir o sistema.
pause
exit /b 0

:fail
echo.
echo [ERRO] A instalacao falhou. Veja as mensagens acima.
pause
exit /b 1
