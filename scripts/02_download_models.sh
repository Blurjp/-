#!/usr/bin/env bash
# Step 2 — download the 1.3B causal-fast checkpoint plus the shared T5/VAE/tokenizer.
#
# The 1.3B Hugging Face upload ships DiT weights only; T5, the VAE and the
# umt5-xxl tokenizer are shared with the 14B release and passed via --assets_dir.
# We fetch ONLY those three items from the 14B repo (~12 GB), not its DiT (~70 GB).
#
# Layout produced:
#   $LW2_MODELS/lingbot-world-v2-1.3b-causal-fast/transformers/   <- DiT shards
#   $LW2_MODELS/lingbot-world-v2-assets/models_t5_umt5-xxl-enc-bf16.pth
#   $LW2_MODELS/lingbot-world-v2-assets/Wan2.1_VAE.pth
#   $LW2_MODELS/lingbot-world-v2-assets/google/umt5-xxl/

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$HERE/lib.sh"
activate_venv

if command -v hf >/dev/null 2>&1; then
  hf_dl() { hf download "$@"; }
else
  hf_dl() { huggingface-cli download "$@"; }
fi

mkdir -p "$LW2_CKPT_DIR/transformers" "$LW2_ASSETS_DIR"
export HF_HUB_ENABLE_HF_TRANSFER="${HF_HUB_ENABLE_HF_TRANSFER:-0}"

say "Endpoint: $HF_ENDPOINT  (export HF_ENDPOINT=https://hf-mirror.com if downloads stall)"

say "1/2 DiT weights: $LW2_DIT_REPO (~3 GB)"
hf_dl "$LW2_DIT_REPO" --local-dir "$LW2_CKPT_DIR/transformers"

say "2/2 Shared assets from $LW2_ASSET_REPO (T5 + VAE + tokenizer, ~12 GB)"
hf_dl "$LW2_ASSET_REPO" --local-dir "$LW2_ASSETS_DIR" \
  --include "models_t5_umt5-xxl-enc-bf16.pth" "Wan2.1_VAE.pth" "google/umt5-xxl/*"

say "Checking the layout generate.py expects"
missing=0
for f in "$LW2_ASSETS_DIR/models_t5_umt5-xxl-enc-bf16.pth" \
         "$LW2_ASSETS_DIR/Wan2.1_VAE.pth" \
         "$LW2_ASSETS_DIR/google/umt5-xxl"; do
  if [ -e "$f" ]; then printf '  OK   %s\n' "$f"; else printf '  FAIL %s\n' "$f"; missing=1; fi
done
if ! compgen -G "$LW2_CKPT_DIR/transformers/*.safetensors" >/dev/null; then
  printf '  FAIL no *.safetensors under %s/transformers\n' "$LW2_CKPT_DIR"; missing=1
else
  printf '  OK   DiT shards under %s/transformers\n' "$LW2_CKPT_DIR"
fi
[ "$missing" -eq 0 ] || die "download incomplete — re-run this script, it resumes."

du -sh "$LW2_CKPT_DIR" "$LW2_ASSETS_DIR" 2>/dev/null || true
say "Done. Next: bash scripts/03_generate.sh"
