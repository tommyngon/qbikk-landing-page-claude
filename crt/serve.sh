#!/bin/sh
# One command to run everything locally:  ./serve.sh   then open http://localhost:5392
cd "$(dirname "$0")" && exec python3 -m http.server 5392
