
# ResumeForge

# Project Documentation

## Overview

This project is a Chrome extension that runs fully on the client side. It requires no backend server and can also be executed offline. The same codebase may also be deployed on GitHub Pages for browser-based access.
This document explains the installation steps, execution flow, offline usage, and how the GitHub Pages version works.

---

## Installation Guide (Chrome Extension)

### 1. Download the Project

Clone or download the repository as a ZIP file and extract it.

```
git clone https://github.com/<your-username>/<your-repo>.git
```

Ensure the root folder contains the required extension files such as:

* manifest.json
* index.html
* app.js
* styles.css
* assets (if any)

### 2. Enable Developer Mode in Chrome

1. Open Chrome
2. Go to: chrome://extensions/
3. Turn on **Developer mode** (top-right corner)

### 3. Load the Unpacked Extension

1. Click **Load unpacked**
2. Select the project folder
3. The extension will appear in your extensions list
4. Pin it to the toolbar if needed

### 4. Running the Extension

Click the extension icon to launch it.
All operations execute locally through the extension’s HTML, CSS, and JavaScript files.

---

## Execution Flow

### 1. Initialization

When the extension UI loads:

* DOMContentLoaded triggers the initialization
* Theme styles, presets, and user interface components are attached
* Saved data (if any) is restored from chrome.storage or localStorage

### 2. State Management

The extension relies on:

* Local state object in memory
* chrome.storage.local (in extension mode)
* localStorage (when executed outside Chrome extension)

The system automatically saves state when any form field changes.

### 3. User Interaction

Based on the project nature, users interact with form fields, switches, buttons, and preview components.
The UI listens for input events, updates the state, and immediately re-renders the preview.

### 4. Rendering Engine

The extension dynamically updates:

* Resume sections
* Styling and theme
* Layout configuration
* Component visibility and ordering

Rendering functions recompute the preview output and update the DOM.

### 5. Exporting or Saving

The project may include:

* PDF export
* HTML export
* JSON save/load
  depending on your implementation.

Exports run purely in the browser without any server requests.

---

## Running the Project Offline

This project supports complete offline execution.

### Offline Requirements

Ensure the project folder contains:

* index.html
* app.js
* manifest.json (for extension mode)
* CSS and asset files

### Running Offline as a Chrome Extension

Chrome extensions inherently run offline once loaded.
No network access is required.

### Running Offline Without Chrome Extension

1. Open the `index.html` file directly using any browser
2. All scripts must be relative paths
3. Avoid external CDN resources unless cached
4. No server is required

---

## GitHub Pages Version (github.io)

A GitHub Pages build allows the project to run like a normal website.

### 1. Enable GitHub Pages

1. Go to the repository
2. Settings → Pages
3. Select the branch (main or docs)
4. Set the folder to `/root` or `/docs`
5. Save changes

Your project will be available at:

```
https://<your-username>.github.io/<your-repo>/
```

### 2. Requirements for GitHub Pages

Ensure:

* All file paths are relative (./assets/img, ./app.js, etc.)
* No Chrome extension APIs are used on GitHub Pages
* Use localStorage instead of chrome.storage for web mode

### 3. Execution Flow on GitHub Pages

The GitHub Pages version:

* Loads index.html normally
* Initializes JavaScript exactly like offline mode
* Stores data in localStorage
* Uses the same rendering functions as the extension

---

## Project Structure (Recommended)

```
root/
│
├── manifest.json
├── index.html
├── app.js
├── styles.css
├── assets/
│   └── ...
└── README.md
```

