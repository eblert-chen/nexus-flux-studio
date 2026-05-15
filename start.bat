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

:: Check if pre-built venv exists
if exist ".\.venv\Scripts\python.exe" (
    echo [Setup] Using bundled environment, skipping uv...
    set USE_VENV=1
    goto :start_server
)

:: No venv found - need to set up with uv
echo [Setup] Environment not found, setting up with uv...

set UV_CACHE_DIR=
set UV_CONFIG_FILE=NUL

if not exist ".\uv.exe" (
    echo [Setup] Downloading uv...
    curl.exe -L -o uv.zip "https://github.com/astral-sh/uv/releases/latest/download/uv-x86_64-pc-windows-msvc.zip" 2>nul
    if not exist ".\uv.zip" (
        echo [ERROR] Failed to download uv
        pause
        exit /b 1
    )
    tar -xf uv.zip 2>nul
    del uv.zip 2>nul
    if not exist ".\uv.exe" (
        echo [ERROR] Failed to extract uv.exe
        pause
        exit /b 1
    )
)

echo [Setup] Installing dependencies...
.\uv.exe sync --cache-dir ".\uv_cache"
if %errorlevel% neq 0 (
    echo [ERROR] Installation failed
    pause
    exit /b 1
)

:start_server
echo.
echo [Start] Nexus Flux Studio starting...
echo.
echo   Press Ctrl+C to stop
echo.

start "" http://localhost:8000

if "%USE_VENV%"=="1" (
    ".\.venv\Scripts\python" main.py
) else (
    .\uv.exe run --cache-dir ".\uv_cache" python main.py
)
pause
