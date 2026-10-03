@echo off
setlocal
title Plataforma Integral FIA - Demo Sprint 1
cd /d "%~dp0"

echo.
echo  Plataforma Integral FIA - Sprint 1
echo  ==================================
echo.

where node >nul 2>nul
if errorlevel 1 goto sin_node

node -e "const [a,b]=process.versions.node.split('.').map(Number);process.exit(a>22||(a===22&&b>=13)?0:1)"
if errorlevel 1 goto node_viejo

if exist "backend\node_modules\express" if exist "web\node_modules\vite" goto instalado
echo  Instalando dependencias: solo la primera vez, puede tardar un par de minutos...
echo.
call npm run instalar
if errorlevel 1 goto error_instalacion

:instalado
echo.
echo  Compilando la web, cargando los datos de demostracion y levantando el servidor...
echo  El navegador se abre solo en http://localhost:3000
echo.
set ABRIR_NAVEGADOR=1
call npm run demo
echo.
echo  El servidor se detuvo.
pause
exit /b 0

:sin_node
echo  No se encontro Node.js. Instala la version LTS desde https://nodejs.org y volve a ejecutar este archivo.
echo.
pause
exit /b 1

:node_viejo
for /f %%v in ('node -v') do set VERSION_NODE=%%v
echo  Tu version de Node.js es %VERSION_NODE% y se necesita la 22.13 o superior.
echo  Instala la version LTS desde https://nodejs.org y volve a ejecutar este archivo.
echo.
pause
exit /b 1

:error_instalacion
echo.
echo  No se pudieron instalar las dependencias. Revisa la conexion a Internet y volve a intentar.
echo.
pause
exit /b 1
