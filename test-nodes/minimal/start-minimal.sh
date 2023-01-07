#! /usr/bin/env bash
CMD="set -x"
CMD="$CMD && (cd /data; npm i ./minimal ./node-red-vue --no-fund --no-audit)"
#CMD="$CMD && ln -s /data .node-red"
#CMD="$CMD && npm run dev -- -v -userDir=/data" # run from node-red source
CMD="$CMD && npm start --cache /data/.npm -- -v -userDir /data" # run normally

docker run --rm -ti -p 1990:1880 \
  -v $PWD:/data/minimal \
  -v $PWD/../..:/data/node-red-vue \
  -v $PWD/nr-data:/data \
  -v /home/flexdash/node-red:/usr/src/node-red \
  --entrypoint bash \
  --name minimal \
  nodered/node-red:3.0.2 \
  -c "$CMD"

  # -v $PWD:/usr/src/node-red/minimal \
  # -v $PWD/../..:/usr/src/node-red/node-red-vue \
