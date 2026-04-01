# ⚙️ Execution Flow & Architecture: ResumeForge

This document outlines the chronological execution flow of the ResumeForge application from the moment the browser loads the script, to user interactions, and finally to document export. 

The application operates on a **Vanilla Reactivity Model**—a unidirectional data flow (One-Way Data Flow) where the UI is purely a reflection of a central `state` object.

---

##  The Macro Execution Flow

1. **Load:** Browser parses HTML and executes `app.js`.
2. **Hydrate:** App retrieves saved data from local storage (or loads defaults).
3. **Bind:** App attaches event listeners to all static HTML inputs.
4. **Render:** App dynamically generates HTML for lists (Experience/Education) and the Live Preview.
5. **Listen (The Loop):** User types -> State updates -> Preview re-renders -> App autosaves.

---

##  Step-by-Step Execution (From Scratch)

### Step 1: Initialization & Utility Setup
Before the app does anything visible, it sets up its toolkit and initial memory structure.

*   **Helper Functions (`$`, `$$`):** The app defines shorthand functions for `document.querySelector` to make **DOM Manipulation** cleaner.
*   **Sanitization (`escHtml`):** Sets up a function to replace `<` and `>` with `&lt;` and `&gt;` to prevent **XSS (Cross-Site Scripting)** attacks when rendering user input.
*   **The State Object:** The `defaultState()` function returns a structured JSON object. This acts as the **Single Source of Truth**. The DOM will never store data; it will only display what is in this object.

### Step 2: The Bootstrapping Phase (`DOMContentLoaded`)
When the browser finishes loading the HTML document, the `DOMContentLoaded` event fires. This is the entry point of the application.

1.  **Storage Adapter (`Store.get`):** Using the **Web Storage API** (and Chrome Extension API), the app looks for saved data.
    *   *If found:* It merges the saved data into the `state` object using `Object.assign()`.
    *   *If empty:* It proceeds with the `defaultState()`.
2.  **UI Initialization:** A cascade of setup functions fires:
    *   `applyTheme()`: Injects CSS Custom Properties (Variables) into the DOM to set the initial colors and fonts.
    *   `bindTopbar()`, `bindFormTabs()`, `bindScaleSliders()`: Attaches **Event Listeners** to static UI elements like color pickers, sliders, and tab buttons.
    *   `renderAllForms()`: Populates the left-side input fields with the loaded state data.
    *   `renderPreview()`: Generates the right-side live resume preview.

### Step 3: The Reactivity Loop (Handling User Input)
When a user types their name into the "Full Name" input, a highly optimized chain of events occurs:

1.  **The Event Trigger:** An `input` event is fired by the browser.
2.  **The Interceptor (`debounce`):** Instead of executing immediately, the event hits the `debounce` **Higher-Order Function**. 
    *   *Concept:* It clears a timer (`clearTimeout`) every time a key is pressed. Only when the user *stops* typing for 120 milliseconds does it allow the execution to proceed. This saves massive amounts of CPU power.
3.  **State Mutation:** The callback (an **Arrow Function**) updates the Single Source of Truth: `state.personal.name = 'John Doe'`.
4.  **UI Re-render (`renderPreview`):** The app calls the render engine. Using **Template Literals**, it injects `state.personal.name` into an HTML string and replaces the entire `innerHTML` of the preview panel.
5.  **Autosave (`triggerSave`):** Another debounced timer starts, pushing the new `state` object back to the **Web Storage API**.

### Step 4: Managing Dynamic Lists (Adding Experience)
When a user clicks "Add Experience", the app must handle dynamically created DOM elements.

1.  **State Push:** A fresh object is created via `newExperience()`. It is given a unique ID (`uid()`) and pushed to the `state.experience` array.
2.  **List Re-render (`renderDynamicList`):** The app clears the left-hand form list. It uses **Array Methods** (`.forEach`) to loop through `state.experience` and creates a new DOM card for each item.
3.  **Event Delegation:** Because these cards are destroyed and recreated frequently, the app attaches event listeners to the new input fields inside the newly created card.
4.  **Updating a specific item:** When a user types in a dynamic field (like "Company Name"), the app uses the `.find()` **Array Method** to locate the exact object in the `state.experience` array by matching the `uid`, updates that specific property, and triggers the render loop again.

### Step 5: Drag and Drop (Reordering Sections)
The app allows users to change the order of resume sections using the **HTML5 Drag and Drop API**.

1.  **Drag Start:** When the user clicks and drags a section, the `dragstart` event fires, storing the index of the dragged item in a variable (`dragSrcIndex`).
2.  **Drag Over:** The `dragover` event allows the item to be dropped by calling `e.preventDefault()`.
3.  **Drop & Swap:** When dropped, the `drop` event fires. The app uses **Array Destructuring** and `.splice()` to remove the section from its old index in `state.sectionOrder` and insert it into the new index.
4.  **Re-render:** `renderPreview()` maps over the newly ordered array, generating the HTML sections in the exact order the user requested.

### Step 6: Document Export (PDF & DOCX)
When the user clicks an export button, the app relies on **Asynchronous JavaScript** to compile the document without freezing the browser.

#### The PDF Export Flow (`exportPDF`)
1.  **DOM Preparation:** The app creates an invisible `div` off-screen.
2.  **Node Cloning:** It uses `el.cloneNode(true)` to duplicate the live preview.
3.  **CSS Override:** It forcibly injects `height: max-content` and `overflow: visible` into the clone. *This ensures the browser's render engine does not visually truncate the bottom of long resumes.*
4.  **Rasterization:** `html2canvas` takes a picture of the unclipped clone.
5.  **PDF Generation:** `jsPDF` takes the image, paginates it into A4/A5 sizes, and triggers a download using Promises (`.then()`).

#### The DOCX Export Flow (`exportDOCX`)
1.  **Dependency Injection (`ensureJSZip`):** Using **Async/Await** and **Promises**, the app checks if the `JSZip` library exists. If not, it dynamically creates a `<script>` tag to download it, pausing execution until it finishes.
2.  **XML Construction:** The app loops through the `state` object and uses **Template Literals** to manually write raw Office Open XML (`<w:p>`, `<w:t>`).
3.  **Zipping:** `JSZip` packages the XML files into a valid `.docx` archive structure.
4.  **Blob & Object URL Generation:** 
    *   The zip is converted into a **Blob** (Binary Large Object).
    *   The **Blob API** generates a temporary URL (`URL.createObjectURL(blob)`).
    *   An invisible `<a>` tag is created, clicked via JavaScript, and then destroyed (`URL.revokeObjectURL`) to free up browser memory.