import React, { useState, useRef } from "react";
import { transcribeAudio } from "../api/gpt5mini";

export default function SpeechToText() {
  const [transcript, setTranscript] = useState("");
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    audioChunksRef.current = [];

    mediaRecorderRef.current.ondataavailable = (e) => {
      audioChunksRef.current.push(e.data);
    };

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
      const formData = new FormData();
      formData.append("file", audioBlob, "audio.wav");

      const res = await transcribeAudio(formData);
      setTranscript(res.data.text);
    };

    mediaRecorderRef.current.start();
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
  };

  return (
    <div>
      <h2>Speech to Text</h2>
      <button onClick={startRecording}>🎙️ Start</button>
      <button onClick={stopRecording}>⏹️ Stop</button>
      <p><strong>Transcript:</strong> {transcript}</p>
    </div>
  );
}
