#!/usr/bin/env sh

ROOT="$(dirname "$0")"
EXECUTABLE="./bin/server.sh"

export PATH
"$ROOT/$EXECUTABLE" $@
