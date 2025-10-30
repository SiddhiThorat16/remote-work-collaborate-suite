// remote-work-collaborate-suite/frontend/remote-work-collaborate-suite/src/components/CollaborativeEditor.jsx
import React, { useEffect, useRef } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { QuillBinding } from "y-quill";
import Quill from "quill";
// Use react-quill's CSS for Vite compatibility
import "react-quill/dist/quill.snow.css";
// Use correct KaTeX CSS path
import "katex/dist/katex.min.css";

const CollaborativeEditor = ({ docName = "default-doc" }) => {
  const editorRef = useRef(null);
  const quillRef = useRef(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const Font = Quill.import("formats/font");
    Font.whitelist = ["sans-serif", "serif", "monospace", "roboto", "inter"];
    Quill.register(Font, true);

    // Vite/Vercel: Use environment variable for websocket endpoint
    const wsEndpoint = import.meta.env.VITE_WS_ENDPOINT || "ws://localhost:1234";

    const ydoc = new Y.Doc();
    const provider = new WebsocketProvider(wsEndpoint, docName, ydoc);
    const ytext = ydoc.getText("quill");

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
        history: {
          delay: 2000,
          maxStack: 500,
          userOnly: true,
        },
      },
    });

    quillRef.current = quill;
    const binding = new QuillBinding(ytext, quill, provider.awareness);

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
      initialized.current = false;
    };
  }, [docName]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 via-white to-indigo-100 p-6">
      <div className="w-full max-w-4xl bg-white shadow-2xl rounded-2xl overflow-hidden border border-gray-200 transition-transform transform hover:scale-[1.01] hover:shadow-3xl duration-300">
        <div className="px-6 py-4 border-b bg-gradient-to-r from-indigo-500 to-blue-500 text-white flex justify-between items-center">
          <h2 className="text-xl font-semibold tracking-wide">📝 Document Editor</h2>
          <span className="text-sm bg-white/20 px-3 py-1 rounded-full font-medium">{docName}</span>
        </div>
        <div
          ref={editorRef}
          className="h-[500px] p-4 bg-white text-gray-800 rounded-b-2xl overflow-y-auto focus:outline-none"
        ></div>
        <div className="text-center text-gray-500 text-sm py-3 bg-gray-50 border-t">
          Remote Work Collaborate Suite 😊
        </div>
      </div>
    </div>
  );
};

export default CollaborativeEditor;
