set -ex

rm -rf aligner-test/data/build
rm -rf dist/mlmr
npm run build
cp -r dist/mlmr/ aligner-test/data/build/

cd aligner-test

docker build --tag 'playwright-python' .

OUTDIR="single2single"
mkdir -p ./data/out/${OUTDIR}
docker run --rm -v $(pwd):/src -u $(id -u):$(id -g) -e version=${version} --ipc=host playwright-python /bin/bash /src/entry.sh in_orig in_transl ${OUTDIR} split_orig split_transl 2>&1 | tee ./data/out/${OUTDIR}/test-stdout.txt 
git --no-pager diff --no-index ./data/out-ref/expected-alignment-${OUTDIR}-out.txt ./data/out/${OUTDIR}/alignment-out.txt > ./data/out/${OUTDIR}/alignment-diff.txt || true

OUTDIR="double2single"
mkdir -p ./data/out/${OUTDIR}
docker run --rm -v $(pwd):/src -u $(id -u):$(id -g) -e version=${version} --ipc=host playwright-python /bin/bash /src/entry.sh in_orig in_transl ${OUTDIR} split_transl 2>&1 | tee ./data/out/${OUTDIR}/test-stdout.txt 
git --no-pager diff --no-index ./data/out-ref/expected-alignment-${OUTDIR}-out.txt ./data/out/${OUTDIR}/alignment-out.txt > ./data/out/${OUTDIR}/alignment-diff.txt || true

OUTDIR="single2double"
mkdir -p ./data/out/${OUTDIR}
docker run --rm -v $(pwd):/src -u $(id -u):$(id -g) -e version=${version} --ipc=host playwright-python /bin/bash /src/entry.sh in_transl in_orig ${OUTDIR} split_orig 2>&1 | tee ./data/out/${OUTDIR}/test-stdout.txt 
git --no-pager diff --no-index ./data/out-ref/expected-alignment-${OUTDIR}-out.txt ./data/out/${OUTDIR}/alignment-out.txt > ./data/out/${OUTDIR}/alignment-diff.txt || true

cd ..
