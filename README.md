# [Multi-Language Manga Reader](https://aligned.pictures)

Read manga/comics in multiple languages at the same time.

Import the two versions of the manga/comic. The pages from the translation will be matched to the originals, minor differences in position and missing pages are detected, so everything should be properly aligned.

![](gifs/mlmr-import.gif)

Switch between languages with left click, peek at translation in a circle above the cursor with right click.

![](gifs/mlmr-peek.gif)

Clicking on the page counter in the bottom left brings up additional options. The slider controls zoom. The `⥀ Peek` button switches left and right mouse button behavior, this is useful for touchscreen where you can't right click.

![](gifs/mlmr-zoom.gif)

Additional keyboard shortcuts:

- `+`/`-`: control zoom
- `<left arrow>` or `a`: jump to top of previous page
- `<right arrow>` or `d`: jump to top of next page
- `n`/`m`: control brightness and sepia filter
- `v`: switch language (same as left click)

# Why

I've started this project to be able read manga in japanese while referencing the translations made by professionals. Being able to read a story I'm interested in gives a lot of motivation to continue. However for the harder sentences it is all the more frustrating if I can't understand what is happening when I care about the story. At first I manually read both versions side by side in different viewers, but that was uncomfortable, and I couldn't help sometimes catching a glance of translations for which I haven't read the original version yet. This web-app solves this simple problem. Additionally, while translations do sometimes take some liberties, having the translation available can still help with figuring out the meaning of the original sentences.

# Technical details

In addition to the above, I also used this project for learning a lot of new things about react, wasm, opencv, etc., so it was two birds with one stone. There is also a lot of things that I still want add and refine, but I have limited time to work on this, so I'm not sure how much of the gigantic TODO list below is going to come true.

I use opencv for image registration, some sanity checks and simple transformations. I've decided to implement the image manipulation part entirely in c++ and build it with emscripten instead of using the prebuilt OpenCV.js. The idea behind it was that I might be able to get better performance this way, but I also mainly just wanted to learn about building wasm from c++.

The overall algorithm:

- try to match the translation image to the original with opencv
  - if successful transform it to line up perfectly (I use a few heuristics on the homography matrix returned by the algorithm to decide if it is a match, usually if there is little change, but if the images don't match, the homography will usually completely mangle the image to overfit onto few matching features)
  - if not successful, maybe a page is missing so let's try to match with the next original
- if there is no match up to a range, move on to the next translation image
- whenever there is a match, check if there were translation images that were skipped this way, and backtrack them to be inserted in order backwards without doing any matching

Other than serving the code the site is completely offline, all of the above is done in the browser and the images are stored in IndexedDB. Currently the wasm memory is fixed at 1024MB, so it should work on mobile devices as well - although it does take longer, and graceful continuation from an interrupted import is not implemented yet. I test with around 190 mostly black and white images, so it should be able to handle a full volume in one go in most cases without running out of memory.

For testing currently there is a setup with playwright that does imports with 3 different configurations and compares the outcomes to the previous version. This is done by logging the exact homography matrixes used and diffing to a known good output.

On the viewer side I tried to pay attention to not have all the images loaded at once, but still offer easy scrolling over the whole document and no position change when resizing the window. The language change is done simply by loading both versions of the page and changing which one is on top. Similarly, peeking is done by adding a `clipPath` around one of the images.

# Backlog of things to fix and features to add

- check for existing collections when importing (right now it will overwrite), regex rule for valid names
- alignment: better size matching (patchsize or other parameters instead of scaling image?)
- search range and png compression parameter as configurable parameters (instead of hardcoded as currently)
- consider internet archive bookreader
- look for unnecessary useEffect usages
- more efficiont scroll position calc
- add loading state to reader when opening collection, so we can block scrolling and avoid overwriting stored position
- resume import if interrupted
- smaller subfolders for reduced memory footprint
- add support for various file formats (?? for pdf, etc.)
- remove file formats other than png from opencv build
- testing UI and additional e2e tests
- have wrap up function to match remaining backtrack stack
- better IDB handling for faster image loads
- avoid flashing on load before dim
- shut down worker after inactivity
- option to configure switching left/right mouse click behavior
- delete inputs after import is done
- solve useEffect dependency lint warnings, useCallback
- dropbox progress bar
- goto page option
- better mobile peeking
- dictionary overlay
  - https://github.com/eidoriantan/kanji.js
  - https://github.com/bryanjenningz/japanese-dictionary
  - https://github.com/asdfjkl/kanjicanvas
  - https://github.com/ZacharyRead/jlect-jhr
- use redux? effect? remeda?
- use react compiler
- use manual indexdDB management instead of wasm filesystem
- configurable peek radius
- refactor
