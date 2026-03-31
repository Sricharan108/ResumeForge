# 📄 Role-Based Resume Builder (Chrome Extension & Web App)

![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)

A privacy-first, fully client-side application developed to help users generate professional resumes tailored to specific job roles. 

Existing resume builders often provide generic templates and restrict advanced features behind subscription paywalls. This open-source tool solves that problem by offering dynamic, role-specific templates, real-time live preview, and instant **PDF & DOCX** downloads—all for free, with zero backend tracking.

## ✨ Features

- **🎯 4 Role-Based Presets:** Instantly switch between layouts optimized for Software Development, Management, Design, and Entry-Level roles.
- **⚡ Real-Time Live Preview:** Watch your A4-sized resume update instantly as you type. No formatting guesswork.
- **🎨 Deep Customization:** Use CSS variables to morph presets. Change primary colors, typography (Google Fonts), layout spacing, and even reorder sections dynamically.
- **💾 Local Auto-Save:** Never lose your progress. The app automatically saves your data locally.
- **📤 Export to PDF & DOCX:** Instantly download your finished resume in industry-standard formats.
- **🔒 Privacy First:** 100% client-side. No backend, no databases, no tracking.

---

## 🚀 Live Demo (GitHub Pages)

Because this project uses no backend, it can be hosted natively on GitHub Pages!

**To deploy to GitHub Pages:**
1. Upload these files to a new GitHub Repository.
2. Go to your repository **Settings** > **Pages**.
3. Under "Build and deployment", select the `main` branch and click **Save**.
4. *(Optional but recommended)*: Rename `builder.html` to `index.html` so it opens automatically when people visit your GitHub Pages URL!

---

## 🧩 Installation (Chrome Extension)

Want to keep it easily accessible in your browser? Install it as a local Chrome Extension:

1. Clone or download this repository to your local machine.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **"Developer mode"** using the toggle in the top right corner.
4. Click the **"Load unpacked"** button.
5. Select the folder containing this repository.
6. Click the new puzzle piece/extension icon in your Chrome toolbar to launch the full-page builder!

---

## 📂 File Structure

```text
├── manifest.json       # Chrome Extension Manifest (V3)
├── background.js       # Service worker to open the app in a new tab
├── builder.html        # Main Application UI (HTML)
├── styles.css          # UI Styling & Dynamic Layout Variables
├── app.js              # State Management, DOM Updates, Export Logic
└── README.md           # Project Documentation
