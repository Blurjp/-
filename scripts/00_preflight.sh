#!/usr/bin/env bash
# Step 0 — verify the WSL2 + RTX 4090 environment before installing anything.
# Nothing here modifies the system.

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$HERE/lib.sh"

fail=0
check() { if eval "$2" >/dev/null 2>&1; then printf '  \033[32mOK\033[0m   %s\n' "$1"; else printf '  \033[31mFAIL\033[0m %s\n' "$1"; fail=1; fi; }

say "Environment"
if in_wsl; then
  printf '  \033[32mOK\033[0m   running inside WSL (%s)\n' "$(uname -r)"
else
  warn "not running inside WSL — these scripts also work on native Linux, continuing"
fi
printf '       distro: %s\n' "$(. /etc/os-release 2>/dev/null && echo "$PRETTY_NAME")"

say "GPU / driver"
if command -v nvidia-smi >/dev/null 2>&1; then
  nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv,noheader | sed 's/^/       /'
  vram_mib="$(nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits | head -1)"
  if [ "${vram_mib:-0}" -lt 22000 ]; then
    warn "GPU reports ${vram_mib} MiB. The 1.3B settings in 03_generate.sh assume ~24 GB (RTX 4090)."
  fi
else
  printf '  \033[31mFAIL\033[0m nvidia-smi not found.\n'
  printf '       Install the NVIDIA driver on WINDOWS (not inside WSL) and restart WSL:\n'
  printf '         https://www.nvidia.com/download/index.aspx  then:  wsl --shutdown\n'
  fail=1
fi

say "Host resources"
printf '       RAM visible to WSL: %s\n' "$(free -h | awk '/^Mem:/{print $2}')"
ram_gb="$(free -g | awk '/^Mem:/{print $2}')"
if [ "${ram_gb:-0}" -lt 24 ]; then
  warn "Only ${ram_gb} GB RAM visible. The T5 text encoder is kept on CPU (~11 GB bf16)."
  warn "Raise it in C:\\Users\\<you>\\.wslconfig  (see docs/WSL_SETUP.md), then: wsl --shutdown"
fi
printf '       Free disk on %s: %s\n' "$HOME" "$(df -h "$HOME" | awk 'NR==2{print $4}')"
free_gb="$(df -BG --output=avail "$HOME" | tail -1 | tr -dc '0-9')"
if [ "${free_gb:-0}" -lt 60 ]; then
  warn "Under 60 GB free. Weights need ~25 GB (1.3B DiT + shared T5/VAE) plus pip caches."
fi

say "Toolchain"
check "$LW2_PYTHON present"    "command -v $LW2_PYTHON"
check "git present"            "command -v git"
check "curl present"           "command -v curl"
check "ffmpeg present (video output)" "command -v ffmpeg"

say "Paths"
printf '       repo    : %s\n' "$LW2_ROOT"
printf '       models  : %s\n' "$LW2_MODELS"
case "$LW2_ROOT$LW2_MODELS" in
  /mnt/*) warn "A path lives under /mnt/ (Windows drive). Disk I/O there is very slow — use a path under \$HOME." ;;
esac

echo
if [ "$fail" -eq 0 ]; then
  say "Preflight passed. Next: bash scripts/01_install.sh"
else
  die "Preflight found blocking problems — see FAIL lines above."
fi
