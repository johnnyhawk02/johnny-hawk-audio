# Johnny Hawk Audio

Home page for Johnny Hawk Audio: browser instruments and plugins. One static `index.html`, ready for GitHub Pages.

## 3D

`/assets/depth.js` folds the white bands in as you scroll and tilts the product cards toward the mouse. It then loads `/assets/scene.js`, a Three.js scene of floating slabs behind the page (skipped on phones for install and guide pages, with Save-Data, and still when reduced motion is on).

Both files are built from `src/`. After editing there:

```sh
npm install
npm run build
```

Commit the rebuilt `assets/` files; GitHub Pages serves them as they are.
