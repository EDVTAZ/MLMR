set -ex

npm run build
rm -r aligner-test/data/build
cp -r dist/mlmr/ aligner-test/data/build/

cd aligner-test
docker build --tag 'playwright-python' .
docker run --rm -v $(pwd):/src -u $(id -u):$(id -g) -e version=${version} --ipc=host playwright-python /bin/bash /src/entry.sh 2>&1 | tee ./data/out/test-stdout.txt 
git --no-pager diff --no-index ./data/out/expected-alignment-out.txt ./data/out/alignment-out.txt > ./data/out/alignment-diff.txt
cd ..
