# TODO

- worker -> shared worker
- memory management
- turn off debug mode compilation flags
- more efficiont scroll position calc
- add loading state to reader so we can block scrolling and avoid overwriting stored position
- allow importing only originals
- have in progress state for worker to avoid starting two imports at the same time
- resume import if interrupted
- smaller subfolders for reduced memory footprint
- add support for various file formats (canvas for images, ?? for zip, pdf, etc.)
- service worker / PWA
- fix double paged import half of images not loading automatically --- actually not even getting properly aligned... because of borders?
