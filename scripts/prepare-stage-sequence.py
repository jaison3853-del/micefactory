#!/usr/bin/env python3
"""Extract an approved, fixed-camera construction film; never invent frames."""
import argparse
import json
from pathlib import Path
import shutil
import subprocess
import tempfile

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("source", type=Path)
parser.add_argument("--output", type=Path, default=Path("public/stage-sequence"))
parser.add_argument("--fps", type=int, default=12)
parser.add_argument("--approve", action="store_true", help="Enable after reviewing every scene and the final-frame match")
args = parser.parse_args()
if not args.source.is_file() or not 6 <= args.fps <= 24:
    parser.error("Provide a source film and fps between 6 and 24")
probe = json.loads(subprocess.check_output(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(args.source)]))
video = next((s for s in probe["streams"] if s["codec_type"] == "video"), None)
if not video or float(probe["format"]["duration"]) * args.fps > 1800:
    parser.error("Film must have a video stream and at most 1800 extracted frames; edit the construction story first")
args.output.mkdir(parents=True, exist_ok=True)
with tempfile.TemporaryDirectory(prefix="stage-sequence-") as temporary:
    root = Path(temporary)
    manifest = {"version": 1, "enabled": args.approve, "fps": args.fps}
    for name, maximum, quality in [("desktop", 1920, 86), ("mobile", 960, 80)]:
        folder = root / name
        folder.mkdir()
        width = min(maximum, int(video["width"])) // 2 * 2
        height = round(int(video["height"]) * width / int(video["width"]) / 2) * 2
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(args.source), "-an", "-vf", f"fps={args.fps},scale={width}:{height}:flags=lanczos", "-c:v", "libwebp", "-quality", str(quality), "-start_number", "0", str(folder / "frame-%05d.webp")], check=True)
        frames = sorted(folder.glob("frame-*.webp"))
        if len(frames) < 2: raise SystemExit("Not enough frames")
        if "frameCount" in manifest and manifest["frameCount"] != len(frames): raise SystemExit("Variant frame counts differ")
        manifest["frameCount"] = len(frames)
        manifest[name] = {"pattern": f"/stage-sequence/{name}/frame-{{index}}.webp", "width": width, "height": height}
    # Build in a temporary directory first; publish the manifest only after both variants exist.
    for name in ("desktop", "mobile"):
        destination = args.output / name
        if destination.exists(): raise SystemExit(f"Refusing to overwrite existing frames: {destination}. Use a fresh output directory.")
    for name in ("desktop", "mobile"):
        shutil.copytree(root / name, args.output / name)
    draft = args.output / "manifest.json.tmp"
    draft.write_text(json.dumps(manifest, indent=2) + "\n")
    draft.replace(args.output / "manifest.json")
print(f"Prepared {manifest['frameCount']} frames per variant; enabled={args.approve}. Review docs/wedding-sequence.md before activation.")
