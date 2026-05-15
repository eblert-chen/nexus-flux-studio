@echo off
title Nexus Flux Studio
cd /d "%~dp0"

echo.
echo   =============================================
echo         Nexus Flux Studio v1.0
echo         RTX 5090 Optimized - BF16 Mode
echo   =============================================
echo.

if not exist ".\models\flux" mkdir ".\models\flux"

echo [Check] Model directory: models\flux\
dir /b ".\models\flux" 2>nul | findstr . >nul
if %errorlevel% neq 0 (
    echo.
    echo   [WARNING] No model folders found in models\flux\
    echo   Please add your Flux model before generating.
    echo.
    echo   Required structure:
    echo     models\flux\[model-name]\
    echo       transformer\diffusion_pytorch_model.safetensors
    echo       text_encoder\model.safetensors
    echo       text_encoder_2\model.safetensors
    echo       vae\diffusion_pytorch_model.safetensors
    echo       scheduler\scheduler_config.json
    echo.
) else (
    echo [Check] Model folders found:
    for /d %%i in (".\models\flux\*") do echo   - %%~ni
    echo.
)

:: Force uv cache to project directory — avoids system config permission issues
set UV_CACHE_DIR=%~dp0uv_cache
if not exist "%UV_CACHE_DIR%" mkdir "%UV_CACHE_DIR%"

echo [Setup] Checking uv package manager...
if not exist ".\uv.exe" (
    echo [Setup] Downloading uv...
    powershell -ExecutionPolicy Bypass -Command "Invoke-WebRequest -Uri 'https://github.com/astral-sh/uv/releases/latest/download/uv-x86_64-pc-windows-msvc.zip' -OutFile 'uv.zip'" 2>nul
    if not exist ".\uv.zip" (
        echo [ERROR] Failed to download uv. Please check your internet connection.
        echo [ERROR] You can manually download from: https://github.com/astral-sh/uv/releases
        echo [ERROR] Extract uv.exe to this folder and re-run start.bat
        pause
        exit /b 1
    )
    powershell -ExecutionPolicy Bypass -Command "Expand-Archive -Path 'uv.zip' -DestinationPath '.' -Force" 2>nul
    del uv.zip 2>nul
    if not exist ".\uv.exe" (
        echo [ERROR] Failed to extract uv.exe
        pause
        exit /b 1
    )
    echo [Setup] uv installed successfully
)

echo [Setup] Installing Python dependencies...
.\uv.exe sync
if %errorlevel% neq 0 (
    echo [ERROR] Dependency installation failed
    pause
    exit /b 1
)

echo.
echo [Start] Nexus Flux Studio starting...
echo.
echo   Open http://localhost:8000 in your browser
echo   Press Ctrl+C to stop
echo.

.\uv.exe run python main.py
pause
