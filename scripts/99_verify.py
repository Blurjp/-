#!/usr/bin/env python3
"""Verify the LingBot-World 2.0 runtime: CUDA, bf16, VRAM, attention backend.

Run inside the project virtualenv:  python scripts/99_verify.py
Exits non-zero if something that would break generation is missing.
"""
import importlib
import sys

problems = []
notes = []


def line(ok, text):
    print(("  OK   " if ok else "  FAIL ") + text)


try:
    import torch
except ImportError:
    print("  FAIL torch is not installed — run scripts/01_install.sh")
    sys.exit(1)

print("Runtime")
print(f"       python {sys.version.split()[0]}")
print(f"       torch  {torch.__version__} (cuda build: {torch.version.cuda})")

cuda = torch.cuda.is_available()
line(cuda, "CUDA available")
if not cuda:
    problems.append(
        "torch cannot see the GPU. Check `nvidia-smi` inside WSL, make sure the "
        "NVIDIA driver is installed on Windows (not in WSL), then `wsl --shutdown`."
    )
else:
    props = torch.cuda.get_device_properties(0)
    gib = props.total_memory / 1024**3
    cap = f"{props.major}.{props.minor}"
    print(f"       device {props.name}  {gib:.1f} GiB  sm_{props.major}{props.minor}")
    line(torch.cuda.is_bf16_supported(), "bfloat16 supported (the model runs in bf16)")
    if not torch.cuda.is_bf16_supported():
        problems.append("bf16 is unsupported on this GPU; the pipeline hardcodes bf16.")
    if gib < 22:
        notes.append(
            f"{gib:.1f} GiB VRAM — lower --frame_num and keep --t5_cpu; 480*832 is the only realistic size."
        )
    if cap < "8.0":
        notes.append(f"compute capability {cap} — bf16/SDPA paths expect Ampere or newer.")
    try:
        a = torch.randn(64, 64, device="cuda", dtype=torch.bfloat16)
        (a @ a).sum().item()
        line(True, "bf16 matmul on device")
    except Exception as exc:  # pragma: no cover - hardware dependent
        line(False, f"bf16 matmul failed: {exc}")
        problems.append(f"bf16 matmul on device failed: {exc}")

print("Dependencies")
for mod in ("torchvision", "transformers", "diffusers", "safetensors", "easydict",
            "ftfy", "einops", "imageio", "cv2", "scipy", "numpy"):
    try:
        importlib.import_module(mod)
        line(True, mod)
    except ImportError as exc:
        line(False, f"{mod} ({exc})")
        problems.append(f"missing dependency: {mod}")

try:
    import numpy
    if numpy.__version__.startswith("2."):
        notes.append("numpy 2.x installed; upstream pins <2 — pin it if you hit ABI errors.")
except ImportError:
    pass

print("Attention backend")
try:
    importlib.import_module("flash_attn")
    line(True, "flash-attn present (fastest path)")
except ImportError:
    line(True, "flash-attn absent — using torch.nn.functional.scaled_dot_product_attention")
    notes.append("SDPA fallback is slower than flash-attn but produces the same output.")

print()
for n in notes:
    print(f"  note: {n}")
if problems:
    print("\nBlocking problems:")
    for p in problems:
        print(f"  - {p}")
    sys.exit(1)
print("Verification passed.")
