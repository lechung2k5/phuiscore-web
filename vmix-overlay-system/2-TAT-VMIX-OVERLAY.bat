@echo off
title Tat vMix Overlay
echo ===================================================
echo TAT VMIX OVERLAY SERVER (CHAY NGAM)
echo ===================================================
echo Dang tat tat ca cac tien trinh Overlay...
wmic process where "name='node.exe' and commandline like '%%overlay-server%%'" call terminate >nul 2>&1
echo Da tat thanh cong! Trang web Control se ngung hoat dong.
pause
