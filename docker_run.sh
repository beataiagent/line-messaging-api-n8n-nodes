#!/bin/bash
docker run -it --rm \
  -p 5678:5678 \
  -e N8N_CUSTOM_EXTENSIONS=/data/custom \
  -v "$PWD:/data/custom" \
  -v "$PWD/data:/home/node/.n8n" \
  n8nio/n8n
