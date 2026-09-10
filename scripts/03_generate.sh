#!/usr/bin/env bash
# Step 3 — run LingBot-World 2.0 (1.3B causal-fast) on a single RTX 4090.
#
# Usage:
#   bash scripts/03_generate.sh                      # bundled example scene
#   bash scripts/03_generate.sh --frames 361         # longer rollout
#   bash scripts/03_generate.sh --example 05 --prompt "a snowy alpine village"
#   bash scripts/03_generate.sh --image /path/start.jpg --actions examples/03
#
# Why these flags on 24 GB:
#   --t5_cpu          keeps the umt5-xxl text encoder (~11 GB bf16) in system RAM
#   --offload_model   moves the DiT off-GPU between chunks (default when world_size==1)
#   --size 480*832    the resolution the 1.3B causal-fast recipe was tuned for
#   --local_attn_size / --sink_size   bound the KV cache so VRAM stays flat as
#                     the rollout grows — this is what makes long horizons fit
#   no --dit_fsdp / --t5_fsdp / --ulysses_size>1: generate.py asserts against
#                     those outside a distributed run, so single-GPU means plain python.

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$HERE/lib.sh"

EXAMPLE="${LW2_EXAMPLE:-03}"
FRAMES="${LW2_FRAMES:-121}"
SIZE="${LW2_SIZE:-480*832}"
CHUNK="${LW2_CHUNK:-4}"
IMAGE=""
ACTIONS=""
SEED="${LW2_SEED:-42}"
PROMPT="${LW2_PROMPT:-A serene lakeside scene with a lone tree standing in calm water, surrounded by distant snow-capped mountains under a bright blue sky with drifting white clouds.}"
EXTRA=()

while [ $# -gt 0 ]; do
  case "$1" in
    --example) EXAMPLE="$2"; shift 2 ;;
    --frames)  FRAMES="$2";  shift 2 ;;
    --size)    SIZE="$2";    shift 2 ;;
    --chunk)   CHUNK="$2";   shift 2 ;;
    --image)   IMAGE="$2";   shift 2 ;;
    --actions) ACTIONS="$2"; shift 2 ;;
    --prompt)  PROMPT="$2";  shift 2 ;;
    --seed)    SEED="$2";    shift 2 ;;
    -h|--help) sed -n "2,18p" "$0"; exit 0 ;;
    *) EXTRA+=("$1"); shift ;;
  esac
done

[ -d "$LW2_ROOT" ] || die "repo missing at $LW2_ROOT — run scripts/01_install.sh"
[ -d "$LW2_CKPT_DIR/transformers" ] || die "weights missing — run scripts/02_download_models.sh"

cd "$LW2_ROOT"
activate_venv

: "${IMAGE:=examples/$EXAMPLE/image.jpg}"
: "${ACTIONS:=examples/$EXAMPLE}"
[ -f "$IMAGE" ]   || die "start image not found: $IMAGE"
[ -d "$ACTIONS" ] || die "action directory not found: $ACTIONS (needs poses.npy / action.npy / intrinsics.npy)"

# frame_num is snapped to 4n+1 by the pipeline and clamped to the number of
# camera poses in the action directory, so a big --frames is safe, just capped.
mkdir -p "$LW2_ROOT/output"
export PYTORCH_CUDA_ALLOC_CONF="${PYTORCH_CUDA_ALLOC_CONF:-expandable_segments:True}"
export TOKENIZERS_PARALLELISM=false

say "1.3B causal-fast | size=$SIZE frames=$FRAMES chunk=$CHUNK seed=$SEED"
say "start image: $IMAGE   actions: $ACTIONS"

set -x
python generate.py \
  --task i2v-1.3B \
  --infer_mode causal_fast \
  --size "$SIZE" \
  --ckpt_dir "$LW2_CKPT_DIR" \
  --assets_dir "$LW2_ASSETS_DIR" \
  --image "$IMAGE" \
  --action_path "$ACTIONS" \
  --frame_num "$FRAMES" \
  --chunk_size "$CHUNK" \
  --local_attn_size 18 \
  --sink_size 6 \
  --base_seed "$SEED" \
  --t5_cpu \
  --offload_model True \
  --save_dir "$LW2_ROOT/output" \
  --prompt "$PROMPT" \
  "${EXTRA[@]+"${EXTRA[@]}"}"
set +x

say "Output written under $LW2_ROOT/output"
say "View it from Windows: explorer.exe \$(wslpath -w \"$LW2_ROOT/output\")"
