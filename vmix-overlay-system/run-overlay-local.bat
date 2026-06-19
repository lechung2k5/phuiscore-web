@echo off
title vMix Overlay Server
echo ===================================================
echo VMIX OVERLAY - LOCAL RUNNER
echo ===================================================
echo.
echo [INFO] Kiem tra ban build giao dien...

IF NOT EXIST "client\dist" (
    echo [INFO] Chua co ban build, dang tien hanh build, doi 1 chut nhe...
    cd client
    call npm install
    call npm run build
    cd ..
    echo [INFO] Build thanh cong!
) ELSE (
    echo [INFO] Da tim thay ban build giao dien.
)

echo [INFO] Dang khoi dong vMix Overlay Server...
echo [INFO] ---------------------------------------------------
echo [INFO] Vui long truy cap vMix Control Panel tai: 
echo [INFO] http://localhost:4000/control
echo [INFO] ---------------------------------------------------
echo [INFO] URL cho vMix Web Browser Input:
echo [INFO] http://localhost:4000/
echo [INFO] ---------------------------------------------------
echo.
echo [INFO] Dang tu dong mo trinh duyet...
start http://localhost:4000/control

cd server
node src\index.js overlay-server
pause
