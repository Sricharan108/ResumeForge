// ResumeForge – Background Service Worker (Manifest V3)
// Opens builder.html in a new tab when the extension icon is clicked.

chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
});
