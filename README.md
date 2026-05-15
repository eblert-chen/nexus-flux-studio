# Nexus Flux Studio

本地化全栈 Flux 文生图 / 图生图工作站，专为 RTX 5090 24GB 优化。解压即用，零环境配置。

## 系统要求

| 项目 | 最低配置 |
|---|---|
| GPU | NVIDIA RTX 5090 (24GB VRAM) |
| 系统 | Windows 10/11 |
| 磁盘 | 50GB+ 可用空间（模型文件约 30-40GB） |
| 其他 | 无需安装 Python、CUDA、Node.js |

## 快速开始

### 1. 获取项目

```bash
git clone <仓库地址>
cd nexus-flux-studio
```

### 2. 准备模型

将 Flux 模型组件放入 `models/flux/` 目录。每个子文件夹代表一个模型，必须包含以下 4 个组件：

```
models/flux/
└── <模型名称>/
    ├── transformer/
    │   └── diffusion_pytorch_model.safetensors    (~16 GB)
    ├── text_encoder/
    │   └── model.safetensors                       (CLIP-L)
    ├── text_encoder_2/
    │   └── model.safetensors                       (T5-XXL BF16)
    ├── vae/
    │   └── diffusion_pytorch_model.safetensors
    └── scheduler/
        └── scheduler_config.json
```

> **提示**：可以放置多个模型（如 flux-dev、flux-schnell），启动后从下拉菜单切换。

### 3. 启动

双击 `start.bat`，脚本会自动完成：
- 检查模型目录结构
- 下载 uv 包管理器（如不存在）
- 安装 Python 依赖（首次约 2-5 分钟）
- 启动 Web 服务器

浏览器打开 **http://localhost:8000** 即可使用。

## 界面指南

```
┌──────────────────────────────────────────────────────────┐
│  Nexus Flux Studio             状态信息    RTX 5090·BF16 │
├──────────┬───────────────────────────────┬───────────────┤
│  模型 ▼  │                               │  历史记录     │
│  模式    │      拖拽图片到此处            │ ┌───────────┐ │
│  提示词  │      或使用左侧面板            │ │  缩略图    │ │
│  负面    │      输入提示词               │ │  提示词    │ │
│  参数    │                               │ │  模型·种子 │ │
│  步数    │     (生成结果展示区)           │ └───────────┘ │
│  引导    │                               │ ┌───────────┐ │
│  种子    │                               │ │  ...       │ │
│  尺寸    │                               │ └───────────┘ │
│ [生成]   │                               │               │
└──────────┴───────────────────────────────┴───────────────┘
```

### 左侧面板

| 区域 | 说明 |
|---|---|
| **模型** | 下拉选择已安装的 Flux 模型。缺失组件时显示黄色警告 |
| **模式** | 切换"文生图"或"图生图"。图生图模式下可上传参考图片 |
| **提示词** | 输入想要的画面描述 |
| **负面提示词** | 输入不想要的内容（留空亦可） |
| **步数** | 推理步数，推荐 28。越高细节越多，耗时越长 |
| **引导强度** | CFG scale，推荐 3.5。数值越高越遵循提示词 |
| **种子** | 随机种子，相同种子+相同参数可复现结果。点击 🎲 随机生成 |
| **重绘强度** | 仅图生图模式。越低越接近原图，越高变化越大 |
| **尺寸** | 5 种预设：正方形 1K / 竖屏 / 横屏 |

### 中间画布

- **拖拽图片**到画布自动切换为图生图模式
- 生成时显示**流光进度条**和步骤百分比
- 完成后展示生成结果

### 右侧画廊

- 瀑布流展示历史生成记录
- **点击任意卡片**可回填该记录的提示词、参数和模式

## 目录结构

```
nexus-flux-studio/
├── main.py              # FastAPI 服务入口
├── engine.py            # Flux 推理引擎
├── db.py                # SQLite 数据库
├── pyproject.toml       # Python 依赖声明
├── start.bat            # 一键启动脚本
├── models/flux/         # 模型存放目录（需自行放入）
├── outputs/             # 生成图片输出目录
├── frontend/            # React 前端源码
│   ├── src/components/  # UI 组件
│   └── dist/            # 编译后的前端（已包含）
└── nexus_history.db     # 历史记录数据库（自动生成）
```

## 常见问题

### Q: 启动时提示"暂无可用模型"

检查 `models/flux/` 下是否有模型文件夹，且包含全部 4 个必需组件。左侧面板会以黄色文字列出具体缺失项。

### Q: 如何添加新模型？

直接将新模型文件夹复制到 `models/flux/` 下，重启服务即可自动识别。

### Q: 如何切换模型？

从左侧面板的模型下拉菜单选择，系统会自动卸载旧模型并加载新模型。

### Q: 显存不足（OOM）

1. 确认使用的是 RTX 5090 24GB
2. 关闭其他占用显存的程序
3. 尝试降低生成尺寸（如 576×1024）

### Q: 启动时 PowerShell 下载 uv 失败

手动从 https://github.com/astral-sh/uv/releases 下载 `uv-x86_64-pc-windows-msvc.zip`，将解压后的 `uv.exe` 放到项目根目录，重新双击 `start.bat`。

### Q: 如何修改前端界面？

```bash
cd frontend
npm install        # 仅首次
npm run dev        # 开发模式，热更新，代理到 :8000
# 修改完毕后
npm run build      # 构建，dist/ 会自动更新
```

### Q: 生成的图片在哪里？

`outputs/` 目录下，文件名格式为 `{模型名}_{时间戳}.png`。

## 技术栈

| 层 | 技术 |
|---|---|
| 后端框架 | FastAPI + Uvicorn |
| 推理引擎 | Diffusers (FluxPipeline / FluxImg2ImgPipeline) |
| 深度学习 | PyTorch 2.x (bfloat16) |
| 数据库 | SQLite + SQLAlchemy |
| 前端 | React 18 + Vite + Tailwind CSS |
| 包管理 | uv (Python) / npm (前端) |
