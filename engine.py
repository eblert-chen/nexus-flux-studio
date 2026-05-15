import gc
import json
from pathlib import Path
from typing import Optional, Callable

import torch
from diffusers import FluxPipeline, FluxImg2ImgPipeline

BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models" / "flux"
OUTPUTS_DIR = BASE_DIR / "outputs"
OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)

REQUIRED_COMPONENTS = ["transformer", "text_encoder", "text_encoder_2", "vae"]


class FluxEngine:
    def __init__(self):
        self._pipe = None
        self._pipe_type = None  # "txt2img" or "img2img"
        self._current_model_name: Optional[str] = None
        self._available_models: dict[str, dict] = {}

    # ------------------------------------------------------------------
    # Model discovery & validation
    # ------------------------------------------------------------------
    def scan_models(self) -> dict[str, dict]:
        """Walk ./models/flux/ and return {model_name: {path, missing, valid}}."""
        MODELS_DIR.mkdir(parents=True, exist_ok=True)
        result = {}
        if not MODELS_DIR.exists():
            return result

        for child in sorted(MODELS_DIR.iterdir()):
            if not child.is_dir():
                continue
            model_path = child
            missing = []
            for comp in REQUIRED_COMPONENTS:
                comp_path = model_path / comp
                if not comp_path.is_dir() or not any(comp_path.iterdir()):
                    missing.append(comp)

            result[child.name] = {
                "path": str(model_path),
                "missing": missing,
                "valid": len(missing) == 0,
            }

        self._available_models = result
        return result

    def get_available_models(self) -> dict[str, dict]:
        if not self._available_models:
            self.scan_models()
        return self._available_models

    # ------------------------------------------------------------------
    # Model loading (singleton, 5090-optimized)
    # ------------------------------------------------------------------
    def load_model(self, model_name: str, pipe_type: str = "txt2img") -> str:
        """Load a Flux model. Returns status string."""
        models = self.get_available_models()
        if model_name not in models:
            return f"Model '{model_name}' not found"
        if not models[model_name]["valid"]:
            missing = models[model_name]["missing"]
            return f"Model '{model_name}' is incomplete — missing: {', '.join(missing)}"

        model_path = models[model_name]["path"]

        if self._current_model_name != model_name:
            self._unload()

        if self._pipe is not None and self._pipe_type == pipe_type:
            return f"Model '{model_name}' already loaded as {pipe_type}"

        if self._pipe is not None and self._pipe_type != pipe_type:
            # Switch pipe type while reusing the same base model
            return self._switch_pipe_type(model_name, model_path, pipe_type)

        # Fresh load
        return self._load_fresh(model_name, model_path, pipe_type)

    def _load_fresh(self, model_name: str, model_path: str, pipe_type: str) -> str:
        try:
            if pipe_type == "img2img":
                pipe = FluxImg2ImgPipeline.from_pretrained(
                    model_path,
                    torch_dtype=torch.bfloat16,
                )
            else:
                pipe = FluxPipeline.from_pretrained(
                    model_path,
                    torch_dtype=torch.bfloat16,
                )

            pipe.to("cuda")
            self._pipe = pipe
            self._pipe_type = pipe_type
            self._current_model_name = model_name
            allocated = torch.cuda.memory_allocated() / (1024 ** 3)
            return f"Loaded '{model_name}' ({pipe_type}) — VRAM: {allocated:.1f} GB"
        except Exception as e:
            self._pipe = None
            self._pipe_type = None
            self._current_model_name = None
            torch.cuda.empty_cache()
            raise RuntimeError(f"Failed to load model '{model_name}': {e}")

    def _switch_pipe_type(self, model_name: str, model_path: str, target_type: str) -> str:
        """Switch between txt2img and img2img reusing the loaded transformer/vae/text_encoders."""
        try:
            components = {
                "transformer": self._pipe.transformer,
                "vae": self._pipe.vae,
                "text_encoder": self._pipe.text_encoder,
                "text_encoder_2": self._pipe.text_encoder_2,
                "tokenizer": self._pipe.tokenizer,
                "tokenizer_2": self._pipe.tokenizer_2,
                "scheduler": self._pipe.scheduler,
            }

            if target_type == "img2img":
                new_pipe = FluxImg2ImgPipeline(**components)
            else:
                new_pipe = FluxPipeline(**components)

            del self._pipe
            self._pipe = new_pipe
            self._pipe_type = target_type
            torch.cuda.empty_cache()
            return f"Switched to {target_type} mode"
        except Exception as e:
            torch.cuda.empty_cache()
            raise RuntimeError(f"Failed to switch pipe type: {e}")

    def _unload(self):
        if self._pipe is not None:
            del self._pipe
            self._pipe = None
            self._pipe_type = None
            self._current_model_name = None
            gc.collect()
            torch.cuda.empty_cache()

    # ------------------------------------------------------------------
    # Inference
    # ------------------------------------------------------------------
    def generate(
        self,
        prompt: str,
        negative_prompt: str = "",
        seed: int = 42,
        steps: int = 28,
        guidance: float = 3.5,
        width: int = 1024,
        height: int = 1024,
        image_path: Optional[str] = None,
        strength: float = 0.8,
        progress_callback: Optional[Callable[[int, int, str], None]] = None,
    ) -> tuple[Path, int]:
        """Run inference. Returns (output_path, seed_used)."""
        if self._pipe is None:
            raise RuntimeError("No model loaded. Call load_model() first.")

        generator = torch.Generator(device="cuda").manual_seed(seed)

        common_kwargs = dict(
            prompt=prompt,
            negative_prompt=negative_prompt or "",
            num_inference_steps=steps,
            guidance_scale=guidance,
            width=width,
            height=height,
            generator=generator,
            output_type="pil",
        )

        if self._pipe_type == "img2img" and image_path:
            from PIL import Image
            init_image = Image.open(image_path).convert("RGB")
            init_image = init_image.resize((width, height))
            result = self._pipe(
                image=init_image,
                strength=strength,
                callback_on_step_end=self._make_callback(progress_callback, steps),
                **common_kwargs,
            )
        else:
            result = self._pipe(
                callback_on_step_end=self._make_callback(progress_callback, steps),
                **common_kwargs,
            )

        # Save output
        import time
        timestamp = int(time.time() * 1000)
        out_name = f"{self._current_model_name}_{timestamp}.png"
        out_path = OUTPUTS_DIR / out_name
        result.images[0].save(out_path)

        if progress_callback:
            progress_callback(steps, steps, "complete")

        return out_path, seed

    def _make_callback(self, user_cb, total_steps):
        def _cb(step_idx: int, _timestep, _latents):
            if user_cb:
                user_cb(step_idx + 1, total_steps, "generating")
        return _cb

    @property
    def is_loaded(self) -> bool:
        return self._pipe is not None

    @property
    def current_model(self) -> Optional[str]:
        return self._current_model_name

    @property
    def current_mode(self) -> Optional[str]:
        return self._pipe_type


# Global singleton
engine = FluxEngine()
