#!/bin/bash
set -a; source .env; set +a
export NODE_ENV=production HOST=0.0.0.0 PORT=8080
node .output/server/index.mjs
