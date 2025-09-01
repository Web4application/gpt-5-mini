import "./app.js";
import "./prompt-studio.js";
import "./chart.js";

// Optional: Dark mode toggle persistence
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark-mode");
}

window.toggleDarkMode = function () {
  document.body.classList.toggle("dark-mode");
  localStorage.setItem(
    "theme",
    document.body.classList.contains("dark-mode") ? "dark" : "light"
  );
};
