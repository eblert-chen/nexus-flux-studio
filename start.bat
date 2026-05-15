@echo off
chcp 65001 >nul
title Nexus Flux Studio

echo.
echo   =============================================
echo         Nexus Flux Studio v1.0
echo         RTX 5090 专属优化 · BF16 模式
echo   =============================================
echo.

cd /d "%~dp0"

:: ============================================================
:: Step 0: 检查模型目录
:: ============================================================
if not exist ".\models\flux" (
    echo [警告] 未找到 models\flux 目录，正在创建...
    mkdir ".\models\flux"
)
echo [检查] 模型目录: models\flux\
dir /b ".\models\flux" 2>nul | findstr . >nul
if %errorlevel% neq 0 (
    echo.
    echo   !!! 注意: models\flux\ 下还没有模型文件夹 !!!
    echo.
    echo   请按以下结构放入 Flux 模型:
    echo   ----------------------------------------
    echo   models\flux\[模型名]\
    echo     transformer\diffusion_pytorch_model.safetensors
    echo     text_encoder\model.safetensors
    echo     text_encoder_2\model.safetensors
    echo     vae\diffusion_pytorch_model.safetensors
    echo     scheduler\scheduler_config.json
    echo   ----------------------------------------
    echo.
    echo   服务器仍会启动，但需要放入模型后才能生成图片。
    echo.
) else (
    echo [检查] 已发现以下模型文件夹:
    for /d %%i in (".\models\flux\*") do echo   - %%~ni
    echo.
)

:: ============================================================
:: Step 1: 检查/下载 uv 包管理器
:: ============================================================
if not exist ".\uv.exe" (
    echo [下载] 正在获取 uv 包管理器...
    powershell -Command "Invoke-WebRequest -Uri https://github.com/astral-sh/uv/releases/latest/download/uv-x86_64-pc-windows-msvc.zip -OutFile uv.zip" 2>nul
    powershell -Command "Expand-Archive -Path uv.zip -DestinationPath . -Force" 2>nul
    del uv.zip 2>nul
    if not exist ".\uv.exe" (
        echo [失败] 无法下载 uv.exe，请手动从以下地址下载并放到此目录:
        echo        https://github.com/astral-sh/uv/releases
        pause
        exit /b 1
    )
    echo [完成] uv 已就绪
)

:: ============================================================
:: Step 2: 安装 Python 依赖
:: ============================================================
echo.
echo [安装] 正在安装 Python 依赖 (首次运行约2-5分钟)...
.\uv.exe sync
if %errorlevel% neq 0 (
    echo [失败] 依赖安装失败，请检查网络连接后重试
    pause
    exit /b 1
)
echo [完成] 依赖已就绪

:: ============================================================
:: Step 3: 启动服务器
:: ============================================================
echo.
echo [启动] Nexus Flux Studio 正在启动...
echo.
echo   ┌──────────────────────────────────────┐
echo   │   浏览器打开: http://localhost:8000    │
echo   │   按 Ctrl+C 停止服务器                 │
echo   └──────────────────────────────────────┘
echo.

.\uv.exe run python main.py

pause
