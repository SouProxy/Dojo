#!/usr/bin/env python3
"""Converte vídeos de exercício em clipes curtos para o app.

Para cada item de sources.json:
  - recorta o trecho (start/duration), centraliza em quadrado 480x480 com fundo escuro,
  - remove o áudio, 24 fps, H.264 (baseline, faststart) ~ 150–600 KB,
  - grava em app/src/main/assets/www/videos/<id>.mp4 e atualiza js/media.js (com crédito e licença).

Formato de sources.json:
  {"items": {"agachamento": {"file": "meus/agacho.mp4" | "url": "https://...", "start": 1.5, "duration": 4,
                             "fit": "crop" | "pad", "credit": "Gravado por Fulano", "license": "própria",
                             "source": "página de origem (opcional)"}}}
Arquivos baixados por "url" ficam em tools/video/.cache (fora do git).
Uso: python3 tools/video/build.py [--check]
"""
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WWW = ROOT / "app/src/main/assets/www"
OUT = WWW / "videos"
SRC = Path(__file__).with_name("sources.json")
ALLOWED = {"própria", "CC0", "CC-BY-4.0", "CC-BY-SA-4.0", "CC-BY-3.0", "CC-BY-SA-3.0", "domínio público", "licenciada"}


def run(args):
    subprocess.run(args, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)


CACHE = Path(__file__).with_name(".cache")
HOSTS = {"wger.de", "upload.wikimedia.org", "commons.wikimedia.org"}


def fetch(url: str) -> Path:
    from urllib.parse import urlparse
    u = urlparse(url)
    if u.scheme != "https" or u.hostname not in HOSTS:
        sys.exit(f"URL não permitida: {url}")
    CACHE.mkdir(exist_ok=True)
    dst = CACHE / Path(u.path).name
    if not dst.exists():
        run(["curl", "-sSfL", "--max-time", "600", "--proto", "=https", "-o", str(dst), url])
    return dst


def convert(src: Path, dst: Path, start: float, duration: float, fit: str = "crop", size: int = 400):
    if fit == "crop":
        vf = f"crop='min(iw,ih)':'min(iw,ih)',scale={size}:{size},fps=24,format=yuv420p"
    else:
        vf = (f"scale={size}:{size}:force_original_aspect_ratio=decrease,"
              f"pad={size}:{size}:(ow-iw)/2:(oh-ih)/2:color=0x15161b,fps=24,format=yuv420p")
    run(["ffmpeg", "-y", "-loglevel", "error", "-ss", str(start), "-t", str(duration), "-i", str(src),
         "-an", "-vf", vf, "-c:v", "libx264", "-profile:v", "baseline", "-level", "3.1", "-preset", "slow",
         "-crf", "30", "-movflags", "+faststart", "-map_metadata", "-1", str(dst)])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="só valida sources.json")
    a = ap.parse_args()
    if not shutil.which("ffmpeg"):
        sys.exit("ffmpeg não encontrado")
    items = json.loads(SRC.read_text(encoding="utf-8")).get("items", {})
    media = {}
    OUT.mkdir(parents=True, exist_ok=True)
    for vid, it in sorted(items.items()):
        lic = it.get("license", "")
        if lic not in ALLOWED or not it.get("credit"):
            sys.exit(f"{vid}: informe credit e uma licença permitida ({', '.join(sorted(ALLOWED))})")
        if a.check:
            continue
        src = fetch(it["url"]) if it.get("url") else (ROOT / it["file"]).resolve()
        if not src.exists():
            sys.exit(f"{vid}: arquivo não encontrado: {src}")
        dst = OUT / f"{vid}.mp4"
        convert(src, dst, float(it.get("start", 0)), float(it.get("duration", 5)), it.get("fit", "crop"))
        media[vid] = {"src": f"videos/{vid}.mp4", "credit": it["credit"], "license": lic}
        if it.get("source"):
            media[vid]["source"] = it["source"]
        print(f"{vid:26s} {dst.stat().st_size / 1024:7.1f} KB")
    if a.check:
        print(f"{len(items)} item(ns) ok")
        return
    body = json.dumps(media, ensure_ascii=False, indent=2)
    js = (WWW / "js/media.js").read_text(encoding="utf-8")
    start = js.index("const MEDIA = ") + len("const MEDIA = ")
    end = js.index(";\n", start)
    (WWW / "js/media.js").write_text(js[:start] + body + js[end:], encoding="utf-8")


if __name__ == "__main__":
    main()
