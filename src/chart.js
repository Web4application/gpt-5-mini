<canvas id="assetChart"></canvas>
<script>
  fetch("assets.json")
    .then(res => res.json())
    .then(data => {
      const grouped = data.reduce((acc, item) => {
        acc[item.type] = (acc[item.type] || 0) + item.size;
        return acc;
      }, {});
      const ctx = document.getElementById("assetChart").getContext("2d");
      new Chart(ctx, {
        type: "bar",
        data: {
          labels: Object.keys(grouped),
          datasets: [{
            label: "Total Size (bytes)",
            data: Object.values(grouped),
            backgroundColor: "rgba(54, 162, 235, 0.6)"
          }]
        }
      });
    });
</script>
