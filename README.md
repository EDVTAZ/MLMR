# Reader app for multiple language versions material

- set zones for easy viewing of large images (avoid side scrolling)
- switch between languages while the app keeps reading position in sync

# TODO

- extra help for syncing zones (sync points)
- undo option
- enlarge function for parts of the UI
- use konva everywhere to show images

- handle type errors without shortcuts
- handle edge-cases without shortcuts
- implement temporary 0-1 zone view for irregular pages (such as 2 page spanning panels) with button press
- implement async stepping in case irregular pages are missing or merged in one language
- implement pdf, cbz, etc. import
- implement main menu
- improve import experience
  - side-by-side import, showing zones on top of each other for comparison
  - editable zones (by typing exact numbers)
  - drag to select/edit zones
- implement it PWA install
- improve storage format / IndexdDB scheme
- implement reader zoom (can I override zoom behavior? or just simply use a custom button)
- implement reader vertical progress indicator
- implement sepia + brightness setting
- change placeholder image from default react logo
- improve image caching (cache not only the bloburl, but have a few actual image tags ready so there is no flashing (even bloburl is loaded async, so there is a slight delay))
- store last position for continue where we left off
- implement jump to page (possibly through URL bar)
