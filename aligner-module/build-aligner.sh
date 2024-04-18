set -ex

make clean
docker run --rm -v $(pwd):/src -u $(id -u):$(id -g) emscripten/emsdk emmake make
cp build/wasm/* ../public/