# Windows side: WSL2 + RTX 4090 for LingBot-World 2.0

Everything here runs in **Windows PowerShell (Administrator)** unless it says
"in WSL". You only do this once.

## 1. Install WSL2 with Ubuntu

```powershell
wsl --install -d Ubuntu-24.04
wsl --set-default-version 2
wsl --status          # confirm "Default Version: 2"
```

Reboot if prompted, then open the Ubuntu terminal and create your Linux user.

Already have WSL? Make sure it is current — GPU support needs a recent kernel:

```powershell
wsl --update
wsl --version         # WSL >= 2.0, kernel >= 5.15
```

## 2. GPU driver — install it on Windows, never inside WSL

Install the standard NVIDIA Game Ready or Studio driver for the RTX 4090 from
<https://www.nvidia.com/download/index.aspx>. It ships the WSL CUDA stack.

**Do not** `apt install nvidia-driver-*` inside WSL. That overwrites the
driver shim the WSL GPU passthrough relies on and breaks `nvidia-smi`.

Then, in WSL:

```sh
nvidia-smi     # should print: NVIDIA GeForce RTX 4090, 24564MiB
```

If it does not, run `wsl --shutdown` in PowerShell and reopen the terminal.

The CUDA *toolkit* is not required — the PyTorch wheels bundle their own CUDA
runtime. You only need `nvcc` if you choose to build flash-attn.

## 3. Give WSL enough RAM and disk

The text encoder is held in system RAM (`--t5_cpu`), so WSL needs headroom.
By default WSL2 takes about half of host RAM. Create or edit
`C:\Users\<you>\.wslconfig`:

```ini
[wsl2]
memory=32GB          # at least 24GB; leave several GB for Windows
swap=16GB
processors=12
localhostForwarding=true
```

Apply it:

```powershell
wsl --shutdown
```

Disk: the virtual disk grows on demand, but budget ~60 GB free on the drive
holding `ext4.vhdx` — weights are ~15 GB, plus pip caches and MP4 output.

## 4. Python

Ubuntu 24.04 ships Python 3.12; upstream declares `>=3.10,<4.0` and pins
`transformers<=4.51.3`. Python 3.11 is the safest choice:

```sh
sudo apt update
sudo apt install -y software-properties-common
sudo add-apt-repository -y ppa:deadsnakes/ppa
sudo apt install -y python3.11 python3.11-venv python3.11-dev
```

To use the distro Python instead: `export LW2_PYTHON=python3` before running
the scripts.

## 5. Run the setup

In WSL, from your clone of this repo:

```sh
bash scripts/00_preflight.sh
bash scripts/01_install.sh
bash scripts/02_download_models.sh
bash scripts/03_generate.sh
```

`01_install.sh` uses `sudo apt-get` for git/ffmpeg/build tools and will prompt
for your password. It is re-runnable.

## 6. Where things end up

```
~/lingbot-world-v2/            upstream clone (generate.py, examples/, .venv/)
~/lingbot-world-v2/output/     generated MP4s
~/lingbot-models/
  lingbot-world-v2-1.3b-causal-fast/transformers/   DiT shards
  lingbot-world-v2-assets/                          T5 + VAE + tokenizer
```

Keep all of it under `$HOME`. Paths under `/mnt/c` cross the 9P filesystem
bridge and make multi-GB weight loads dramatically slower.

## 7. Watching a run

Open a second WSL shell:

```sh
watch -n 2 nvidia-smi          # VRAM and utilisation
```

On a 4090 with the defaults in `03_generate.sh` (480×832, `--t5_cpu`,
`--offload_model True`), expect roughly 14–20 GB of VRAM in use and a steady
state that does not climb as the rollout lengthens — that flatness is the
`--local_attn_size 18 --sink_size 6` KV-cache window doing its job.

## 8. Using your own start image and actions

`--action_path` is a directory containing the camera track and control signals
that ship with the bundled examples:

```
examples/03/
  image.jpg          start frame
  poses.npy          camera-to-world matrices, one per frame
  intrinsics.npy     camera intrinsics
  action.npy         action vector per frame
  wasd_action.npy    keyboard-style controls
```

The simplest custom run swaps only the image and prompt while reusing an
existing camera track:

```sh
bash scripts/03_generate.sh --image ~/my_scene.jpg --actions examples/03 \
     --prompt "a quiet harbour at dawn, boats rocking gently"
```

Generating your own `poses.npy` means producing the same array shapes upstream
uses; start from `wan/utils/cam_utils.py` in the clone.
