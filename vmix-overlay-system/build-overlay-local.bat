@echo off
title vMix Overlay Builder
echo ===================================================
echo VMIX OVERLAY - BUILDER
echo ===================================================
echo.
echo [INFO] Dang build lai giao dien vMix Overlay...
cd client
call npm install
call npm run build
echo.
echo [INFO] Build thanh cong! Ban da co the chay file 'run-overlay-local.bat'
pause
