#!/usr/bin/env bash
# Shared configuration and helpers for the LingBot-World 2.0 WSL2 setup.
# Source this from the numbered scripts; do not run it directly.

set -euo pipefail

# ---- Tunables (override by exporting before running a script) ----------------
# Where the upstream lingbot-world-v2 repository is cloned.
LW2_ROOT="${LW2_ROOT:-$HOME/lingbot-world-v2}"
# Where model weights live. Keep this on the WSL ext4 filesystem, NOT /mnt/c.
LW2_MODELS="${LW2_MODELS:-$HOME/lingbot-models}"
# Python interpreter used to create the virtualenv.
LW2_PYTHON="${LW2_PYTHON:-python3.11}"
# Virtualenv location.
LW2_VENV="${LW2_VENV:-$LW2_ROOT/.venv}"
# CUDA wheel index for the PyTorch install. cu124 works on RTX 40-series (sm_89).
LW2_TORCH_INDEX="${LW2_TORCH_INDEX:-https://download.pytorch.org/whl/cu124}"
# Set to 1 to also build flash-attn (optional; the code falls back to PyTorch SDPA).
LW2_BUILD_FLASH_ATTN="${LW2_BUILD_FLASH_ATTN:-0}"
# Set to https://hf-mirror.com if huggingface.co is slow/blocked for you.
HF_ENDPOINT="${HF_ENDPOINT:-https://huggingface.co}"
export HF_ENDPOINT

LW2_UPSTREAM="${LW2_UPSTREAM:-https://github.com/robbyant/lingbot-world-v2.git}"
LW2_DIT_REPO="robbyant/lingbot-world-v2-1.3b-causal-fast"
LW2_ASSET_REPO="robbyant/lingbot-world-v2-14b-causal-fast"

# Directory names expected by generate.py --ckpt_dir / --assets_dir.
LW2_CKPT_DIR="$LW2_MODELS/lingbot-world-v2-1.3b-causal-fast"
LW2_ASSETS_DIR="$LW2_MODELS/lingbot-world-v2-assets"

# ---- Helpers ----------------------------------------------------------------
say()  { printf '\033[1;36m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[warn]\033[0m %s\n' "$*" >&2; }
die()  { printf '\033[1;31m[fail]\033[0m %s\n' "$*" >&2; exit 1; }

in_wsl() { grep -qiE 'microsoft|wsl' /proc/version 2>/dev/null; }

activate_venv() {
  [ -f "$LW2_VENV/bin/activate" ] || die "venv missing at $LW2_VENV — run scripts/01_install.sh first"
  # shellcheck disable=SC1091
  source "$LW2_VENV/bin/activate"
}
