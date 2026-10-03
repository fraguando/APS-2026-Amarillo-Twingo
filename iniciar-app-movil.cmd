@echo off
setlocal
title Plataforma Integral FIA - App movil
cd /d "%~dp0mobile"

echo.
echo  Plataforma Integral FIA - App movil (Expo)
echo  ==========================================
echo.
echo  Importante: el backend tiene que estar corriendo (iniciar-demo.cmd en otra ventana).
echo.

where node >nul 2>nul
if errorlevel 1 goto sin_node

if exist "node_modules\expo" goto instalado
echo  Instalando dependencias de la app: solo la primera vez, puede tardar unos minutos...
echo.
call npm install
if errorlevel 1 goto error_instalacion

:instalado
echo.
echo  - Celular: escanea el codigo QR con la app Expo Go (misma red Wi-Fi que la PC).
echo  - Navegador: la app se abre sola en una pestana nueva.
echo.
call npx expo start --web
pause
exit /b 0

:sin_node
echo  No se encontro Node.js. Instala la version LTS desde https://nodejs.org y volve a ejecutar este archivo.
echo.
pause
exit /b 1

:error_instalacion
echo.
echo  No se pudieron instalar las dependencias. Revisa la conexion a Internet y volve a intentar.
echo.
pause
exit /b 1
