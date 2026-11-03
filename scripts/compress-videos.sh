#!/usr/bin/env bash
# Shrinks videos for Upcoming Posts before they're uploaded, so playing them doesn't eat into the
# Vercel Blob store's monthly data transfer.
#
# Usage: scripts/compress-videos.sh <input-folder> [output-folder]
#
# For each video in the input folder it writes, to the output folder (default <input>/compressed):
#   <name>.mp4  H.264, at most 720p tall, with the index at the start so it plays straight away
#   <name>.jpg  a poster frame from about 1s in, 720px wide
# The app grabs its own poster when a video is uploaded; the .jpg is for checking the result.
#
# Needs ffmpeg: brew install ffmpeg

set -euo pipefail

TARGET_BYTES=$((5 * 1024 * 1024))
UPLOAD_LIMIT_BYTES=$((8 * 1024 * 1024))

if [[ $# -lt 1 || ! -d "$1" ]]; then
  echo "Usage: $0 <input-folder> [output-folder]" >&2
  exit 1
fi

if ! command -v ffmpeg >/dev/null; then
  echo "ffmpeg isn't installed. Run: brew install ffmpeg" >&2
  exit 1
fi

input_dir="$1"
output_dir="${2:-$input_dir/compressed}"
mkdir -p "$output_dir"

shopt -s nullglob nocaseglob
videos=("$input_dir"/*.{mov,mp4,m4v,webm})
shopt -u nocaseglob

if [[ ${#videos[@]} -eq 0 ]]; then
  echo "No videos found in $input_dir" >&2
  exit 1
fi

for input in "${videos[@]}"; do
  name="$(basename "${input%.*}")"
  video_out="$output_dir/$name.mp4"
  poster_out="$output_dir/$name.jpg"

  echo "→ $name"
  ffmpeg -hide_banner -loglevel error -y -i "$input" \
    -vf "scale=-2:'min(720,ih)'" -c:v libx264 -crf 26 -preset veryfast \
    -c:a aac -b:a 96k -movflags +faststart "$video_out"
  # Very short clips have no frame at 1s, so fall back to the first frame.
  ffmpeg -hide_banner -loglevel error -y -ss 1 -i "$input" -frames:v 1 \
    -vf "scale=720:-2" -q:v 5 "$poster_out" ||
    ffmpeg -hide_banner -loglevel error -y -i "$input" -frames:v 1 \
      -vf "scale=720:-2" -q:v 5 "$poster_out"

  bytes=$(stat -f%z "$video_out" 2>/dev/null || stat -c%s "$video_out")
  size="$(awk "BEGIN { printf \"%.1f MB\", $bytes / 1048576 }")"
  if ((bytes > UPLOAD_LIMIT_BYTES)); then
    echo "  $size: too big to upload (8 MB limit). Trim it, or raise -crf to 28–30."
  elif ((bytes > TARGET_BYTES)); then
    echo "  $size: uploads fine, but is over the 5 MB target."
  else
    echo "  $size"
  fi
done

echo "Done. Upload the .mp4 files from $output_dir"
