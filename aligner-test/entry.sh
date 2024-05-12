python3 -m http.server --directory /src/data/build 4200 &
python3 /src/playwright-test.py $@