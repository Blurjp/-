#!/usr/bin/env bash
# Step 1 — clone lingbot-world-v2 and build a self-contained virtualenv.
#
# Safe to re-run: an existing clone is fetched/reset to origin/main, and pip
# installs are idempotent.

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$HERE/lib.sh"
REQ="$(cd "$HERE/.." && pwd)/requirements-wsl.txt"

command -v "$LW2_PYTHON" >/dev/null 2>&1 || die \
  "$LW2_PYTHON not found. On Ubuntu 24.04: sudo apt install python3.11 python3.11-venv python3.11-dev
   (or export LW2_PYTHON=python3 if your default python is >=3.10,<4.0)"

say "System packages (git, ffmpeg, build tools)"
if command -v apt-get >/dev/null 2>&1; then
  sudo apt-get update -qq
  sudo apt-get install -y -qq git git-lfs ffmpeg build-essential "${LW2_PYTHON}-venv" "${LW2_PYTHON}-dev"
else
  warn "apt-get not found — install git, git-lfs and ffmpeg yourself."
fi

say "Cloning $LW2_UPSTREAM -> $LW2_ROOT"
if [ -d "$LW2_ROOT/.git" ]; then
  git -C "$LW2_ROOT" fetch --depth 1 origin main
  git -C "$LW2_ROOT" checkout -q main 2>/dev/null || git -C "$LW2_ROOT" checkout -qB main origin/main
  git -C "$LW2_ROOT" reset --hard origin/main
else
  git clone --depth 1 "$LW2_UPSTREAM" "$LW2_ROOT"
fi

say "Creating virtualenv at $LW2_VENV ($("$LW2_PYTHON" -V))"
[ -d "$LW2_VENV" ] || "$LW2_PYTHON" -m venv "$LW2_VENV"
# shellcheck disable=SC1091
source "$LW2_VENV/bin/activate"
python -m pip install -q --upgrade pip wheel setuptools

say "Installing PyTorch from $LW2_TORCH_INDEX"
# cu124 wheels cover the RTX 40-series (sm_89). If that index has no wheel for
# your Python/torch combination, fall back to the default PyPI wheels, which
# also bundle a CUDA runtime.
if ! pip install -q torch torchvision --index-url "$LW2_TORCH_INDEX"; then
  warn "no wheel at $LW2_TORCH_INDEX — falling back to the default PyPI index"
  warn "(override with LW2_TORCH_INDEX=https://download.pytorch.org/whl/cu128)"
  pip install -q torch torchvision
fi

say "Installing project dependencies"
pip install -q -r "$REQ"

if [ "$LW2_BUILD_FLASH_ATTN" = "1" ]; then
  say "Building flash-attn (optional, 30-60 min; MAX_JOBS limited to avoid OOM)"
  pip install -q ninja packaging
  MAX_JOBS="${MAX_JOBS:-4}" pip install flash-attn --no-build-isolation \
    || warn "flash-attn build failed — that is survivable, the model falls back to PyTorch SDPA."
else
  say "Skipping flash-attn (PyTorch SDPA fallback will be used). Set LW2_BUILD_FLASH_ATTN=1 to build it."
fi

say "Verifying the install"
python "$HERE/99_verify.py" || die "verification failed"

say "Done. Next: bash scripts/02_download_models.sh"
