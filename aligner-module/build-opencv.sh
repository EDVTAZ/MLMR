set -ex

OPENCV_MAKE="opencv-build-command.sh"
OPENCV_INSTALL="opencv-install-command.sh"

rm -rf opencv
mkdir -p opencv
git clone --depth 1 --branch 4.x git@github.com:opencv/opencv.git opencv
cp $OPENCV_MAKE opencv/
cp $OPENCV_INSTALL opencv/
docker run --rm -v $(pwd)/opencv:/src -u $(id -u):$(id -g) emscripten/emsdk /bin/bash $OPENCV_MAKE
docker run --rm -it -v $(pwd)/opencv:/src -u 0:0 emscripten/emsdk /bin/bash $OPENCV_INSTALL
sudo chown -R $USER:$USER opencv/buildout/installed_include/
cp -r opencv/buildout/installed_include include
mkdir -p libs
cp -r opencv/buildout/3rdparty/lib libs/3rdparty
cp -r opencv/buildout/lib libs/opencv