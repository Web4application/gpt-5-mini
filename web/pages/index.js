import { useState } from 'react';

export default function Home(){
  const [prompt, setPrompt] = useState('');
  const [reply, setReply] = useState('');

  async function send(){
    const res = await fetch('/api/generate', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({prompt})
    });
    const data = await res.json();
    setReply(JSON.stringify(data.output, null, 2));
  }

  return (
    <main style={{padding:20}}>
      <h1>ChatGPT-5 (beta)</h1>
      <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} rows={6} cols={80}/>
      <br/>
      <button onClick={send}>Generate</button>
      <pre>{reply}</pre>
    </main>
  );
}
