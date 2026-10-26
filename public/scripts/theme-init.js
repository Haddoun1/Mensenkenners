// Zet dark mode aan voordat de pagina getekend wordt (voorkomt een witte flits).
// Los bestand in plaats van een inline script, zodat de Content Security Policy het toestaat.
if (localStorage.getItem("theme") === "dark") {
  document.documentElement.classList.add("dark-mode");
}
