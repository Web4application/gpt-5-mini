self.addEventListener("install", event => {
  console.log("Service Worker: Installed");
});

self.addEventListener("activate", event => {
  console.log("Service Worker: Activated");
});

self.addEventListener("fetch", event => {
  // For now just let network handle it.
});
