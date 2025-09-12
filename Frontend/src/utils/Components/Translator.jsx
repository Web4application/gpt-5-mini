import React, { useState } from "react";
import { translateText } from "../api/gpt5mini";

export default function Translator() {
  const [text, setText] = useState("");
  const [lang, setLang] = useState("fr");
  const [translated, setTranslated] = useState("");

  const handleTranslate = async () => {
    const res = await translateText(text, lang);
    setTranslated(res.data.translated);
  };

  return (
    <div>
      <h2>Translator</h2>
      <input value={text} onChange={(e) => setText(e.target.value)} />
      <input value={lang} onChange={(e) => setLang(e.target.value)} />
      <button onClick={handleTranslate}>Translate</button>
      <p>{translated}</p>
    </div>
  );
}
