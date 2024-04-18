set -ex

cd buildout
make install
cp -r /usr/local/include/opencv4/ /src/buildout/installed_include
