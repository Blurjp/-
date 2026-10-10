# LingBot-World 2.0 on Windows (WSL2) + RTX 4090

> Also in this repo: **[sinian/](sinian/)** — 思念, an on-device app for talking with an AI simulation of a deceased relative, with family consent ([research](sinian/docs/RESEARCH.md)).

Setup for running **LingBot-World 2.0 / LingBot-World-Infinity** — the open-source
interactive world model from Robbyant (Ant Lingbo) referenced in the post — on a
single consumer GPU under WSL2.

Upstream: <https://github.com/robbyant/lingbot-world-v2> · paper
[arXiv:2607.07534](https://arxiv.org/abs/2607.07534) · license CC BY-NC-SA 4.0
(**non-commercial use only**).

## Which model you actually want

| Variant | Size | HF repo | On a 4090 |
| --- | --- | --- | --- |
| `lingbot-world-v2-1.3b-causal-fast` | 1.3B | `robbyant/lingbot-world-v2-1.3b-causal-fast` | **Yes** — this is what these scripts install |
| `lingbot-world-v2-14b-causal-fast` | 14B | `robbyant/lingbot-world-v2-14b-causal-fast` | No — upstream recipe is 8 GPUs |
| `lingbot-world-v2-14b-causal-pretrain` | 14B | `robbyant/lingbot-world-v2-14b-causal-pretrain` | No — 40-step CFG sampling, multi-GPU |
| `lingbot-world-v2-14b-bid` | 14B | `robbyant/lingbot-world-v2-14b-bid` | No — teacher model for distillation/finetuning |

The 1.3B causal-fast is the "consumer single-GPU" variant from the post. You give it a
start image, a camera/action track and a text prompt; it rolls the world forward
chunk-by-chunk with a KV cache, so VRAM stays flat as the clip gets longer.

## Quick start

In a WSL2 Ubuntu shell:

```sh
git clone <this repo> lingbot-wsl && cd lingbot-wsl
bash scripts/00_preflight.sh        # checks driver, VRAM, RAM, disk, python
bash scripts/01_install.sh          # clones upstream + builds the venv
bash scripts/02_download_models.sh  # ~15 GB of weights
bash scripts/03_generate.sh         # renders the bundled example scene
```

Output lands in `~/lingbot-world-v2/output/*.mp4`. Open it from Windows with
`explorer.exe $(wslpath -w ~/lingbot-world-v2/output)`.

Full Windows-side instructions (WSL install, driver, `.wslconfig` memory tuning)
are in **[docs/WSL_SETUP.md](docs/WSL_SETUP.md)**. When something breaks, see
**[docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)**.

## What the scripts do differently from upstream

Upstream's commands assume a multi-GPU node (`torchrun --nproc_per_node=4`,
`--dit_fsdp --t5_fsdp --ulysses_size 4`). `generate.py` explicitly asserts those
off outside a distributed run, so single-GPU means plain `python generate.py`
with `--ulysses_size 1`. On top of that:

- **`--t5_cpu`** — the umt5-xxl text encoder is ~11 GB in bf16. Kept in system
  RAM it never competes with the DiT for VRAM. This is why the setup wants
  ≥24 GB of RAM visible to WSL, not just 24 GB of VRAM.
- **`--offload_model True`** (the single-GPU default) moves the DiT off-GPU
  between chunks.
- **flash-attn is optional.** `wan/modules/attention.py` falls back to
  `torch.nn.functional.scaled_dot_product_attention`, so `requirements-wsl.txt`
  drops the `flash_attn` pin that would otherwise trigger a 30–60 minute build.
  Opt back in with `LW2_BUILD_FLASH_ATTN=1 bash scripts/01_install.sh`.
- **Partial asset download.** The 1.3B HF repo ships DiT weights only; T5, the
  VAE and the umt5-xxl tokenizer are shared with the 14B release and passed via
  `--assets_dir`. `02_download_models.sh` pulls just those three from the 14B
  repo (~12 GB) instead of its full ~70 GB.

## Configuration

Every script reads these environment variables (see `scripts/lib.sh`):

| Variable | Default | Meaning |
| --- | --- | --- |
| `LW2_ROOT` | `~/lingbot-world-v2` | upstream clone |
| `LW2_MODELS` | `~/lingbot-models` | weight storage |
| `LW2_PYTHON` | `python3.11` | interpreter for the venv (upstream needs ≥3.10) |
| `LW2_TORCH_INDEX` | `.../whl/cu124` | PyTorch CUDA wheel index |
| `LW2_BUILD_FLASH_ATTN` | `0` | set `1` to build flash-attn |
| `HF_ENDPOINT` | `https://huggingface.co` | set to `https://hf-mirror.com` if downloads stall |

Keep both paths on the WSL ext4 filesystem. Putting them under `/mnt/c` makes
weight loading several times slower.

## Generation options

```sh
bash scripts/03_generate.sh --frames 361            # longer rollout
bash scripts/03_generate.sh --example 05            # another bundled scene
bash scripts/03_generate.sh --image start.jpg --actions examples/03 \
                            --prompt "a neon-lit alley in the rain"
```

`--frames` is snapped to `4n+1` by the pipeline and clamped to the number of
camera poses in the action directory, so asking for more than the track provides
just gives you the whole track. Start at 121 and raise it once you have seen a
run finish.

## Reality check on "real-time"

The 60 fps / 720p figures in the announcement come from Robbyant's own served
deployment, not from `generate.py`. This repo's path is offline rendering to an
MP4: a 121-frame 480×832 clip on a 4090 takes minutes, not milliseconds. For an
interactive loop, upstream points at
[SGLang's LingBot-World cookbook](https://docs.sglang.io/cookbook/diffusion/LingBot-World/LingBot-World-2.0)
or [NVIDIA flashdreams](https://github.com/NVIDIA/flashdreams) — they explicitly
do not release their serving code. If you just want to try the interactive
version, [Reactor](https://www.reactor.inc/lingbot-world-v2) hosts it in a browser.
