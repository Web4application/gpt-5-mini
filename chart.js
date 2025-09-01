async function loadChart() {
  const res = await fetch("assets.json");
  const data = await res.json();

  const labels = data.map(item => item.name);
  const sizes = data.map(item => item.size);

  new Chart(document.getElementById("assetChart"), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Asset Size (KB)",
        data: sizes,
        backgroundColor: "#2575fc"
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

window.addEventListener("DOMContentLoaded", loadChart);
