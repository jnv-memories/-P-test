# About

it is direct implimantation of $p recogniser to efficiently recognising sigils, signs, glyphs using as much less resources possible.
Previously i used $N recogniser but $P worked more fine than $N. 
Source and documentation of pdollar.js: https://depts.washington.edu/acelab/proj/dollar/pdollar.htmlhttps://depts.washington.edu/acelab/proj/dollar/pdollar.html

pdollar.js source: https://depts.washington.edu/acelab/proj/dollar/pdollar.js

there's a 
const NumPoints = 60; in pdollar.js, originally its value was 32 but can be increase for increased sensitivity.

# Adding new signs or glyphs

currently added predefined strokes set from https://github.com/ytnrvdf/wha-spell-simulator/blob/main/src/dictionary/sigils.json to add fire and water sigil as example in stokesData.js

in https://github.com/ytnrvdf/wha-spell-simulator/blob/main/src/dictionary/sigils.json the strokes are in format of "Normalized Unit-Square Coordinates"

        [{"x": 0.5,"y": 0}, {"x": 0.506,"y": 0}, {"x": 0.512,"y": 0.006}, {"x": 0.518,"y": 0.006}, ...
        ] value between 0 to 1
        
but $P uses "Absolute 1D Point Cloud" 
        
        [Point { X: 250, Y: 0,   ID: 1 },
        Point { X: 253, Y: 0,   ID: 1 },
        Point { X: 256, Y: 3,   ID: 1 },
        Point { X: 100, Y: 100, ID: 2 }  // A second stroke flattened into the same array]

the conversion is done by parseCustomJsonTemplate() func in app.js  So it expects the Normalised Unit-Square Coordinate from strokesData.js 
Any new sigil sign can be added via strokesData.js in fixed formate or can be added directly from canvas.
Both mmethod currently stores in LocalStorage.

Recommendation: draw in canvas and save it.

# Functions explain of (`app.js`)

#### `initCustomTemplates()`
* **Inputs:** None
* **What it does:** Synchronizes your persistent local storage with the live recognition engine. It clears the active recognizer's runtime template stack, parses any user-created shapes saved in `localStorage`, and merges them with the default vector templates loaded from your asset files (`strokesData.js`). It then handles structural compilation, handles missing values, and registers the unified dataset back into the active engine instance.
* **Returns:** Void.

---

#### `saveTemplateToStorage(name, pointsArray)`
* **Inputs:** `name` (String), `pointsArray` (Array of raw canvas `Point` objects)
* **What it does:** Extracts raw drawing data from the canvas history and serializes it into local browser storage. It strips away runtime overhead parameters from the array points to isolate a clean data schema (`{ X, Y, ID }`), pushes this structural footprint into the local template collection array, commits the stringified array to `localStorage`, and triggers a runtime re-initialization to instantly update your recognizer.
* **Returns:** Void.

---

#### `clearSpecificTemplate(index)`
* **Inputs:** `index` (Number)
* **What it does:** Mutates the underlying `localStorage` template database by splicing out a user-defined gesture at a specific array offset position. After clearing the target footprint out of storage, it executes an application-wide synchronization routine to rebuild the active runtime arrays seamlessly.
* **Returns:** Void.

---

#### `parseCustomJsonTemplate(templateData, scaleSize)`
* **Inputs:** `templateData` (Object containing relative multi-stroke coordinate arrays), `scaleSize` (Number — defaults to canvas width)
* **What it does:** Processes normalized multi-stroke data structures into absolute coordinates. It maps relative geometric decimal values (scaled between `0.0` and `1.0` on a unit square) back into real-world pixel positions based on canvas layout properties. During iteration, it maps the nested arrays into a flattened format while injecting concrete tracking `Point` class instances initialized with explicitly bound stroke identity tags.
* **Returns:** `parsedPoints` (Array of compiled engine-ready `Point` instances).

---

#### `redrawCanvas()`
* **Inputs:** None
* **What it does:** Handles low-level UI frame refreshes by clearing the HTML5 `<canvas>` context completely. It walks back through your drawing history array to reconstruct user vectors on-screen based on interactive toggle preferences. It handles color allocation via stroke assignment indexing, mapping connected linear stroke paths using standard geometric vectors or rendering explicitly isolated arc nodes directly over coordinates.
* **Returns:** Void.

---

#### `getCanvasMousePos(e)`
* **Inputs:** `e` (Event Object — MouseEvent or TouchEvent)
* **What it does:** Resolves cross-platform hardware pointer coordinates. It handles target touch lists or traditional cursor offsets, subtracts client display boundaries relative to the bounding box of the destination container, and maps precise drawing inputs to coordinate positions aligned perfectly with canvas bounds.
* **Returns:** Object literal layout containing exact coordinates `{ x: Number, y: Number }`.


