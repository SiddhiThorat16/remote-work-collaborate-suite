// src/components/CollaborativeEditor.jsx
import React, { useEffect, useRef } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { QuillBinding } from "y-quill";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import "katex/dist/katex.min.css";

const CollaborativeEditor = ({ docName = "default-doc" }) => {
  const editorRef = useRef(null);
  const quillRef = useRef(null);

  useEffect(() => {
    if (quillRef.current) return;

    // Font whitelist
    const Font = Quill.import("formats/font");
    Font.whitelist = ["sans-serif", "serif", "monospace", "roboto", "inter"];
    Quill.register(Font, true);

    // Yjs doc & websocket provider
    const ydoc = new Y.Doc();
    const provider = new WebsocketProvider(
      "ws://localhost:1234",
      docName,
      ydoc
    );
    const ytext = ydoc.getText("quill");

    // Quill initialization
    const quill = new Quill(editorRef.current, {
      theme: "snow",
      placeholder: "Start collaborating...",
      modules: {
        toolbar: [
          [{ font: [] }, { size: [] }],
          ["bold", "italic", "underline", "strike"],
          [{ color: [] }, { background: [] }],
          [{ script: "sub" }, { script: "super" }],
          [{ header: 1 }, { header: 2 }, "blockquote", "code-block"],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ indent: "-1" }, { indent: "+1" }, { align: [] }],
          ["link", "image", "video"],
          ["clean"],
        ],
        history: { delay: 2000, maxStack: 500, userOnly: true },
      },
    });

    quillRef.current = quill;

    // Yjs binding
    const binding = new QuillBinding(ytext, quill, provider.awareness);

    // Awareness: assign single user once
    if (!provider.awareness.getLocalState()?.user) {
      provider.awareness.setLocalStateField("user", {
        name: `User-${Math.floor(Math.random() * 1000)}`,
        color: "#" + Math.floor(Math.random() * 16777215).toString(16),
      });
    }

    return () => {
      binding.destroy();
      provider.disconnect();
      ydoc.destroy();
      quillRef.current = null;
    };
  }, [docName]);
};

export default CollaborativeEditor;
