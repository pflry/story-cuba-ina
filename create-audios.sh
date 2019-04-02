#!/usr/bin/env bash

set -e

# Usage create-audios.sh SOURCE_FILE [OUTPUT_NAME]
[[ ! "${1}" ]] && echo "Usage: create-audios.sh SOURCE_FILE [OUTPUT_NAME]" && exit 1

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
ffmpeg -i ${source} -codec:a libmp3lame -ar 44100 -b:a 96k ${target}/audio.mp3
echo
ffmpeg -i ${source} -c:a libopus -b:a 64k ${target}/audio.ogg

echo
printf "WEBVTT\n\n00:01.000 --> 00:02.680 line:-6 position:5%% size:90%% align:start\nLorem <c.exergue>ipsum</c>" > ${target}/subtitles.vtt

echo
echo -e "\033[33mEncodage audio terminé - Les fichiers audio sont dans le dossier ${target}\033[0m"

