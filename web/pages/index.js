import { useState } from "react";

export default function Home(){
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState("");

  async function send(){
    setReply("…thinking");
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ prompt })
    });
    const j = await res.json();
    setReply(JSON.stringify(j, null, 2));
  }

  return (
    <main style={{padding:20, fontFamily: "system-ui, sans-serif"}}>
      <h1>ChatGPT-5 — Beta</h1>
      <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={6} cols={80}/>
      <br />
      <button onClick={send} style={{marginTop:10}}>Generate</button>
      <pre style={{whiteSpace:"pre-wrap", marginTop:20}}>{reply}</pre>
    </main>
  );
}
