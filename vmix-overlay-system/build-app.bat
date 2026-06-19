@echo off
title Dong Goi Phan Mem vMix Overlay
echo ===================================================
echo     Tien Trinh Dong Goi He Thong Thanh File .exe
echo ===================================================
echo.

echo [1/5] Dang vao thu muc Client de Build giao dien...
cd client
call npm install
call npm run build
if %ERRORLEVEL% neq 0 (
    echo [Loi] Khong the build Client ReactJS. Vui long kiem tra lai.
    pause
    exit /b %ERRORLEVEL%
)
cd ..
echo [1/5] Build Client thanh cong!
echo.

echo [2/5] Dang thiet lap Server...
cd server
call npm install
echo - Don dep thu muc public cu (neu co)...
if exist "public" rmdir /S /Q "public"
echo - Copy giao dien Client vao Server public...
xcopy /E /I /H /Y "..\client\dist" "public"
echo [2/5] Thiet lap Server thanh cong!
echo.

echo [3/5] Dang tien hanh dong goi bang PKG (Chuyen Node.js thanh .exe)...
call npx pkg . --targets node18-win-x64 --output vMix-Overlay-Server.exe
if %ERRORLEVEL% neq 0 (
    echo [Loi] Khong the dong goi file .exe bang pkg. Vui long kiem tra lai.
    pause
    exit /b %ERRORLEVEL%
)
echo [3/5] Dong goi thanh cong! File: vMix-Overlay-Server.exe
echo.

echo [4/5] Dang tao thu muc phat hanh (Release)...
cd ..
if exist "Release-vMix-Overlay" rmdir /S /Q "Release-vMix-Overlay"
mkdir "Release-vMix-Overlay"
mkdir "Release-vMix-Overlay\uploads"
mkdir "Release-vMix-Overlay\uploads\nha_tai_tro"
mkdir "Release-vMix-Overlay\uploads\logo_dai"
move "server\vMix-Overlay-Server.exe" "Release-vMix-Overlay\"

echo.
echo ===================================================
echo   XUAT BAN THANH CONG!
echo ===================================================
echo Tat ca da duoc dong goi san sang trong thu muc:
echo vmix-overlay-system\Release-vMix-Overlay\
echo.
echo [!] Huong dan su dung cho khach hang:
echo 1. Giai nen (hoac copy) toan bo thu muc Release-vMix-Overlay
echo 2. Click dup vao file "vMix-Overlay-Server.exe"
echo 3. Mo vMix hoac trinh duyet o dia chi: http://localhost:4000
echo.
pause
