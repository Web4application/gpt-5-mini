export const fetchResponse = async (prompt) => {
  const res = await fetch(`/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  return res.json();
};

export const getSessions = async () => {
  const res = await fetch(`/api/sessions`);
  return res.json();
};
