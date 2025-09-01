async function sendPrompt() {
  const topic = document.getElementById("topic").value;
  const file = document.getElementById("pdf").files[0];
  const template = document.getElementById("template").value;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("topic", topic);
  formData.append("template", template);

  const res = await fetch("/api/prompt", {
    method: "POST",
    body: formData
  });

  const data = await res.json();
  document.getElementById("output").textContent = data.response;
}
