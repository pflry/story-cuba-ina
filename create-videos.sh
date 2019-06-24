#!/usr/bin/env bash

set -e

# Usage create-videos.sh SOURCE_FILE [OUTPUT_NAME]
[[ ! "${1}" ]] && echo "Usage: create-videos.sh SOURCE_FILE [OUTPUT_NAME]" && exit 1

#########################################################################

source="${1}"
target="${2}"
if [[ ! "${target}" ]]; then
  target="${source##*/}" # leave only last component of path
  target="${target%.*}"  # strip extension
fi
mkdir -p ${target}

# start conversion
echo -e "\033[33mExecuting command: ffmpeg\033[0m"
echo
ffmpeg-normalize ${source} -o ${source} -f
echo -e "\033[33mNormalize du fichier ${source} terminé\033[0m"

echo
ffmpeg -i ${source} -c:v libx264 -crf 23 -vf "pad=ceil(iw/2)*2:ceil(ih/2)*2" -pix_fmt yuv420p -c:a aac -ar 44100 -b:a 96k -movflags faststart ${target}/video.mp4
echo
ffmpeg -i ${source} -f webm -c:v libvpx-vp9 -minrate: 375k -maxrate: 1088k -b:v 750k -crf 23 -pix_fmt yuv420p -threads 8 -speed 4 -vf scale=iw:ih -acodec libopus -b:a 64k ${target}/video.webm
echo
ffmpeg -i ${source} -vf "thumbnail,scale=480:720" -qscale:v 4 -frames:v 1 ${target}/poster.jpg

#echo
#printf "WEBVTT\n\n00:01.000 --> 00:02.680 line:-6 position:5%% size:90%% align:start\nLorem <c.exergue>ipsum</c>" > ${target}/subtitles.vtt

echo
echo -e "\033[33mEncodage vidéo terminé - Les vidéos sont dans le dossier ${target}\033[0m"
