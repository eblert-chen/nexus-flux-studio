import asyncio
import json
import uuid
from concurrent.futures import ThreadPoolExecutor
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from db import init_db, add_generation, get_history
from engine import engine, OUTPUTS_DIR

BASE_DIR = Path(__file__).resolve().parent
DIST_DIR = BASE_DIR / "frontend" / "dist"


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    engine.scan_models()
    yield


app = FastAPI(title="Nexus Flux Studio", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_executor = ThreadPoolExecutor(max_workers=1)
_active_ws: dict[str, WebSocket] = {}


# ---------------------------------------------------------------------------
# REST endpoints
# ---------------------------------------------------------------------------
@app.get("/api/models")
def list_models():
    models = engine.get_available_models()
    return {"models": models}


@app.post("/api/load-model")
def load_model(model_name: str = Form(...), pipe_type: str = Form("txt2img")):
    msg = engine.load_model(model_name, pipe_type)
    return {"status": "ok", "message": msg, "current_model": engine.current_model, "current_mode": engine.current_mode}


@app.post("/api/generate")
async def generate_image(
    prompt: str = Form(...),
    negative_prompt: str = Form(""),
    seed: int = Form(42),
    steps: int = Form(28),
    guidance: float = Form(3.5),
    width: int = Form(1024),
    height: int = Form(1024),
    mode: str = Form("txt2img"),
    strength: float = Form(0.8),
    reference_image: Optional[UploadFile] = File(None),
):
    loop = asyncio.get_running_loop()

    def on_progress(step: int, total: int, status: str):
        """Thread-safe progress dispatcher — broadcasts to all WebSocket clients."""
        msg = json.dumps({"type": "progress", "step": step, "total": total, "status": status})
        loop.call_soon_threadsafe(
            lambda: asyncio.ensure_future(_broadcast_progress(msg))
        )

    async def _broadcast_progress(msg: str):
        dead = []
        for sid, ws in list(_active_ws.items()):
            try:
                await ws.send_text(msg)
            except Exception:
                dead.append(sid)
        for sid in dead:
            _active_ws.pop(sid, None)

    ref_path: Optional[str] = None
    if reference_image and reference_image.filename:
        ref_dir = BASE_DIR / "uploads"
        ref_dir.mkdir(exist_ok=True)
        ref_path = str(ref_dir / f"ref_{uuid.uuid4().hex[:8]}.png")
        with open(ref_path, "wb") as f:
            f.write(await reference_image.read())

    try:
        out_path, seed_used = await loop.run_in_executor(
            _executor,
            lambda: engine.generate(
                prompt=prompt,
                negative_prompt=negative_prompt,
                seed=seed,
                steps=steps,
                guidance=guidance,
                width=width,
                height=height,
                image_path=ref_path if mode == "img2img" else None,
                strength=strength,
                progress_callback=on_progress,
            ),
        )

        add_generation(
            prompt=prompt,
            negative_prompt=negative_prompt,
            seed=seed_used,
            steps=steps,
            guidance=guidance,
            model_name=engine.current_model or "unknown",
            mode=mode,
            image_path=str(out_path.name),
            width=width,
            height=height,
        )

        return {
            "status": "ok",
            "image_url": f"/outputs/{out_path.name}",
            "seed": seed_used,
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/api/history")
def history(limit: int = 50, offset: int = 0):
    return {"history": get_history(limit=limit, offset=offset)}


@app.get("/api/status")
def status():
    return {
        "model_loaded": engine.is_loaded,
        "current_model": engine.current_model,
        "current_mode": engine.current_mode,
        "models_available": len(engine.get_available_models()),
    }


# ---------------------------------------------------------------------------
# WebSocket for real-time progress
# ---------------------------------------------------------------------------
@app.websocket("/ws/progress")
async def ws_progress(ws: WebSocket):
    await ws.accept()
    ws_id = str(uuid.uuid4())
    _active_ws[ws_id] = ws
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        _active_ws.pop(ws_id, None)


# ---------------------------------------------------------------------------
# Static files
# ---------------------------------------------------------------------------
@app.get("/outputs/{filename}")
def serve_output(filename: str):
    return FileResponse(OUTPUTS_DIR / filename)


if DIST_DIR.exists():
    app.mount("/assets", StaticFiles(directory=DIST_DIR / "assets"), name="assets")


@app.get("/{full_path:path}")
async def serve_frontend(full_path: str = ""):
    """Serve the React SPA — fallback to index.html."""
    index_path = DIST_DIR / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    return {"status": "ok", "message": "Nexus Flux Studio API is running. Frontend not built yet."}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
