# Troubleshooting

## `nvidia-smi: command not found` inside WSL

The driver goes on **Windows**, not in WSL. Install the RTX 4090 driver from
nvidia.com, then `wsl --shutdown` in PowerShell and reopen the terminal. If you
previously ran `apt install nvidia-driver-*` inside WSL, remove it
(`sudo apt purge '^nvidia-.*'`) — it shadows the passthrough shim.

## `torch.cuda.is_available()` is False but `nvidia-smi` works

You installed a CPU-only torch wheel. Reinstall from the CUDA index:

```sh
source ~/lingbot-world-v2/.venv/bin/activate
pip uninstall -y torch torchvision
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu124
python scripts/99_verify.py
```

## `t5_fsdp and dit_fsdp are not supported in non-distributed environments`

You copied an upstream command. Those flags — and `--ulysses_size > 1` — only
work under `torchrun` with more than one GPU. Use `scripts/03_generate.sh`,
which runs plain `python generate.py`.

## `CUDA out of memory`

In the order worth trying:

1. Lower the rollout: `bash scripts/03_generate.sh --frames 61`.
2. Confirm `--t5_cpu` is in effect (it is, by default in `03_generate.sh`) —
   the umt5-xxl encoder alone is ~11 GB in bf16.
3. Shrink the decode chunk: `--chunk 2`.
4. Keep `--size 480*832`. 720p on 24 GB with the 1.3B is not realistic.
5. Close anything else using the GPU — a browser with hardware acceleration or
   a game launcher can hold 1–2 GB.
6. `export PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True` (set by the script)
   reduces fragmentation across chunks.

If VRAM *climbs* with frame count instead of staying flat, the KV window flags
were dropped — `--local_attn_size 18 --sink_size 6` are what bound it.

## The WSL process is killed / "Killed" with no traceback

The Linux OOM killer, not CUDA. T5 on CPU needs ~11 GB of system RAM. Raise
`memory=` in `C:\Users\<you>\.wslconfig`, then `wsl --shutdown`. See
[WSL_SETUP.md](WSL_SETUP.md#3-give-wsl-enough-ram-and-disk).

## `FileNotFoundError: Required asset 'models_t5_umt5-xxl-enc-bf16.pth' not found`

The shared assets did not download, or `--assets_dir` points at the wrong place.
Re-run `bash scripts/02_download_models.sh` — it resumes — and check:

```sh
ls ~/lingbot-models/lingbot-world-v2-assets
# models_t5_umt5-xxl-enc-bf16.pth  Wan2.1_VAE.pth  google/
```

## `flash-attn` fails to build

Expected, and harmless. The attention module falls back to PyTorch SDPA
automatically; results are identical, throughput is lower. If you do want it:

```sh
LW2_BUILD_FLASH_ATTN=1 MAX_JOBS=4 bash scripts/01_install.sh
```

`MAX_JOBS` above 4 will typically OOM the WSL VM during compilation.

## Hugging Face downloads stall or time out

```sh
export HF_ENDPOINT=https://hf-mirror.com
bash scripts/02_download_models.sh
```

Downloads resume, so an interrupted run costs nothing but time.

## `numpy` ABI errors after installing something else

Upstream pins `numpy<2`. If a later install pulled numpy 2.x:

```sh
pip install "numpy>=1.23.5,<2"
```

## Generation finishes but the MP4 is missing or unplayable

`imageio-ffmpeg` supplies the encoder; a system `ffmpeg` helps too:

```sh
sudo apt install -y ffmpeg
```

Videos are written to `~/lingbot-world-v2/output/`. Open the folder from
Windows with `explorer.exe $(wslpath -w ~/lingbot-world-v2/output)`.

## Generation is far slower than the announcement suggests

It will be. The 60 fps / 720p numbers describe Robbyant's served real-time
deployment, whose code is not released. `generate.py` is an offline
chunk-by-chunk renderer. For interactive serving see
[SGLang](https://docs.sglang.io/cookbook/diffusion/LingBot-World/LingBot-World-2.0)
or [flashdreams](https://github.com/NVIDIA/flashdreams).
