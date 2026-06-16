@echo off
cd /d "%~dp0"

start "R Sports Dev Server" cmd /k "npm run dev"
timeout /t 4 /nobreak >nul
start "" "http://localhost:3000/?capa=1"
