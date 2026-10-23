# Refbox prototype

Clickable prototype of Refbox, a reference organizer for designers: saved designs are tagged,
cut into elements (header, logo, button, typography, footer) and linked back to the full design.

The prototype is a single static `index.html` with no build step.

## Chrome extension

`extension/` is Refbox as a Chrome extension. It catches images you save on Awwwards,
Pinterest, Dribbble and Instagram (download or right-click → Save to Refbox), keeps them
in the browser's own storage and opens the library from the toolbar icon.

Install: `chrome://extensions` → Developer mode → Load unpacked → choose the `extension` folder.
