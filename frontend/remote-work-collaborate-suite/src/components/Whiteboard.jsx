// src/components/Whiteboard.jsx
import React, { useRef, useEffect, useState } from "react";

const colors = ["black", "red", "green", "blue", "orange", "purple", "yellow", "brown"];
const brushSizes = [2, 4, 6, 8, 10, 12, 14];

const Whiteboard = () => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null); // store context
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState("black");
  const [brushSize, setBrushSize] = useState(4);
  const [isEraser, setIsEraser] = useState(false);

  const [history, setHistory] = useState([]); // for undo
  const [redoStack, setRedoStack] = useState([]); // for redo (future use)
  const [tool, setTool] = useState('pen'); // pen, rect, circle, line, arrow, text
  const [shapeStart, setShapeStart] = useState(null); // {x, y} for shape start
  const [previewShape, setPreviewShape] = useState(null); // for shape preview
  const [textInput, setTextInput] = useState('');
  const [textPos, setTextPos] = useState(null); // {x, y} for text
  const [isPlacingText, setIsPlacingText] = useState(false);

  // Image upload and drag state
  const [uploadedImg, setUploadedImg] = useState(null);
  const [imgPos, setImgPos] = useState(null); // {x, y}
  const [isDraggingImg, setIsDraggingImg] = useState(false);
  const [imgOffset, setImgOffset] = useState({ x: 0, y: 0 });
  const [imgPreviewSize, setImgPreviewSize] = useState({ width: 200, height: 200 }); // default preview size

  // Initialize canvas once
  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth * 0.85;
    canvas.height = window.innerHeight * 0.7;
    canvas.style.border = "2px solid #333";
    canvas.style.borderRadius = "10px";
    canvas.style.cursor = "crosshair";
    canvas.style.boxShadow = "0 4px 10px rgba(0,0,0,0.2)";

    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctxRef.current = ctx; // store context reference
  }, []);

  // Helper to get mouse position
  const getMousePos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    let x, y;
    if (e.touches && e.touches.length > 0) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    return { x, y };
  };

  // Save current canvas state to history
  const saveToHistory = () => {
    const canvas = canvasRef.current;
    setHistory((prev) => [canvas.toDataURL(), ...prev].slice(0, 20)); // limit history to 20
  };

  // Drawing handlers for pen and shapes
  const startDrawing = (e) => {
    // Prevent drawing if placing text
    if (isPlacingText) return;
    const ctx = ctxRef.current;
    const { x, y } = getMousePos(e);
    if (tool === 'pen' || tool === 'eraser') {
      setDrawing(true);
      ctx.beginPath();
      ctx.moveTo(x, y);
    } else if (tool === 'rect' || tool === 'circle' || tool === 'line' || tool === 'arrow') {
      setShapeStart({ x, y });
      setPreviewShape(null);
      setDrawing(true);
    } else if (tool === 'text') {
      setTextPos({ x, y });
      setIsPlacingText(true);
      setTextInput('');
    }
  };

  const draw = (e) => {
    const ctx = ctxRef.current;
    const { x, y } = getMousePos(e);
    if (tool === 'pen' || tool === 'eraser') {
      if (!drawing) return;
      ctx.strokeStyle = isEraser ? "white" : color;
      ctx.lineWidth = brushSize;
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if ((tool === 'rect' || tool === 'circle' || tool === 'line' || tool === 'arrow') && shapeStart) {
      // Preview shape
      setPreviewShape({ x1: shapeStart.x, y1: shapeStart.y, x2: x, y2: y });
      // Redraw preview
    //   redrawCanvasWithPreview({ x1: shapeStart.x, y1: shapeStart.y, x2: x, y2: y });
    }
  };

  const stopDrawing = (e) => {
    const ctx = ctxRef.current;
    if (tool === 'pen' || tool === 'eraser') {
      setDrawing(false);
      ctx.closePath();
      saveToHistory(); // Save after pen stroke
    } else if ((tool === 'rect' || tool === 'circle' || tool === 'line' || tool === 'arrow') && shapeStart && previewShape) {
      drawShapeOnCanvas(previewShape, true);
      setShapeStart(null);
      setPreviewShape(null);
      setDrawing(false);
      saveToHistory(); // Save after shape
    }
  };

  // Redraw canvas and draw preview shape
  const redrawCanvasWithPreview = (shape) => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    // Save current image
    const img = new window.Image();
    img.src = canvas.toDataURL();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      drawShapeOnCanvas(shape, false);
    };
  };

  // Draw shape on canvas
  const drawShapeOnCanvas = (shape, commit = false) => {
    const ctx = ctxRef.current;
    ctx.save();
    ctx.strokeStyle = isEraser ? "white" : color;
    ctx.lineWidth = brushSize;
    ctx.beginPath();
    const { x1, y1, x2, y2 } = shape;
    if (tool === 'rect') {
      ctx.rect(x1, y1, x2 - x1, y2 - y1);
    } else if (tool === 'circle') {
      const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
      ctx.arc(x1, y1, radius, 0, 2 * Math.PI);
    } else if (tool === 'line') {
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    } else if (tool === 'arrow') {
      // Draw line
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      // Draw arrowhead
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const headlen = 15 + brushSize * 1.5;
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - headlen * Math.cos(angle - Math.PI / 6), y2 - headlen * Math.sin(angle - Math.PI / 6));
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - headlen * Math.cos(angle + Math.PI / 6), y2 - headlen * Math.sin(angle + Math.PI / 6));
    }
    ctx.stroke();
    ctx.restore();
    if (commit) ctx.closePath();
  };

  // Text tool handlers
  const handleTextInput = (e) => {
    setTextInput(e.target.value);
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!textInput.trim() || !textPos) return;
    const ctx = ctxRef.current;
    ctx.save();
    ctx.font = `${18 + brushSize * 2}px Arial`;
    ctx.fillStyle = color;
    ctx.fillText(textInput, textPos.x, textPos.y);
    ctx.restore();
    setTextInput('');
    setTextPos(null);
    setIsPlacingText(false);
    saveToHistory(); // Save after text
  };

  // Handle image file upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new window.Image();
      img.src = ev.target.result;
      img.onload = () => {
        // Scale preview to max 200x200, keep aspect ratio
        let width = img.width;
        let height = img.height;
        if (width > 200 || height > 200) {
          const scale = Math.min(200 / width, 200 / height);
          width = width * scale;
          height = height * scale;
        }
        setImgPreviewSize({ width, height });
        setUploadedImg(img);
        setImgPos({ x: 100, y: 100 }); // Default position
      };
    };
    reader.readAsDataURL(file);
  };

  // Handle placing and dragging image
  const handleCanvasMouseDown = (e) => {
    if (uploadedImg && imgPos) {
      const { x, y } = getMousePos(e);
      // Check if click is inside image bounds
      if (
        x >= imgPos.x &&
        x <= imgPos.x + uploadedImg.width &&
        y >= imgPos.y &&
        y <= imgPos.y + uploadedImg.height
      ) {
        setIsDraggingImg(true);
        setImgOffset({ x: x - imgPos.x, y: y - imgPos.y });
        return;
      }
    }
    startDrawing(e);
  };

  const handleCanvasMouseMove = (e) => {
    if (isDraggingImg && uploadedImg) {
      const { x, y } = getMousePos(e);
      setImgPos({ x: x - imgOffset.x, y: y - imgOffset.y });
      return;
    }
    draw(e);
  };

  const handleCanvasMouseUp = (e) => {
    if (isDraggingImg && uploadedImg) {
      setIsDraggingImg(false);
      return;
    }
    stopDrawing(e);
  };

  // Commit image to canvas
  const commitImageToCanvas = () => {
    if (uploadedImg && imgPos) {
      const ctx = ctxRef.current;
      ctx.drawImage(uploadedImg, imgPos.x, imgPos.y, imgPreviewSize.width, imgPreviewSize.height);
      setUploadedImg(null);
      setImgPos(null);
      saveToHistory();
    }
  };

  const clearCanvas = () => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveToHistory(); // Save after clear
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = "whiteboard.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  // Export as image (PNG, JPEG, SVG)
  const exportImage = (type) => {
    const canvas = canvasRef.current;
    let mimeType = "image/png";
    let ext = "png";
    if (type === "jpeg") {
      mimeType = "image/jpeg";
      ext = "jpg";
    }
    // SVG export: rasterize canvas to SVG image
    if (type === "svg") {
      const imgData = canvas.toDataURL("image/png");
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${canvas.width}' height='${canvas.height}'><image href='${imgData}' width='${canvas.width}' height='${canvas.height}'/></svg>`;
      const blob = new Blob([svg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `whiteboard.svg`;
      link.href = url;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return;
    }
    // PNG/JPEG
    const link = document.createElement("a");
    link.download = `whiteboard.${ext}`;
    link.href = canvas.toDataURL(mimeType);
    link.click();
  };

  // Undo functionality
  const handleUndo = () => {
    if (history.length === 0) return;
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    const img = new window.Image();
    img.src = history[0];
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      setHistory((prev) => prev.slice(1));
    };
  };

  return (
    <div className="flex flex-col items-center mt-8 font-sans min-h-screen bg-gradient-to-br from-blue-50 to-purple-100">
      <h1 className="mb-4 text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-500 to-pink-400 drop-shadow-lg select-none">
        🎨 Whiteboard
      </h1>
      {/* Toolbar */}
      <div className="mb-6 flex flex-wrap justify-center gap-3 p-4 rounded-xl shadow-lg bg-white/80 backdrop-blur border border-gray-200">
        {/* Tool selector */}
        <select
          value={tool}
          onChange={e => setTool(e.target.value)}
          className="px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base font-medium bg-white shadow-sm"
        >
          <option value="pen">Pen</option>
          <option value="rect">Rectangle</option>
          <option value="circle">Circle</option>
          <option value="line">Line</option>
          <option value="arrow">Arrow</option>
          <option value="text">Text</option>
        </select>

        <select
          onChange={(e) => setBrushSize(parseInt(e.target.value))}
          value={brushSize}
          className="px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base font-medium bg-white shadow-sm"
        >
          {brushSizes.map((size) => (
            <option key={size} value={size}>{size}px</option>
          ))}
        </select>

        {colors.map((c) => (
          <button
            key={c}
            className={`w-8 h-8 rounded-full border-2 transition-all duration-150 ${color === c && !isEraser ? 'border-blue-600 scale-110 shadow-lg' : 'border-gray-300'} hover:scale-110`}
            style={{ backgroundColor: c }}
            onClick={() => { setColor(c); setIsEraser(false); }}
          />
        ))}

        <button
          onClick={() => setIsEraser(!isEraser)}
          className={`px-3 py-1 rounded font-semibold border transition-all duration-150 ${isEraser ? 'bg-red-100 border-red-400 text-red-700' : 'bg-gray-100 border-gray-300 text-gray-700'} hover:bg-red-200`}
        >
          {isEraser ? "Eraser ON" : "Eraser OFF"}
        </button>

        <button
          onClick={handleUndo}
          className="px-3 py-1 rounded font-semibold border border-gray-300 bg-gray-100 text-gray-700 hover:bg-yellow-100 transition-all duration-150"
        >
          Undo
        </button>
        <button
          onClick={clearCanvas}
          className="px-3 py-1 rounded font-semibold border border-gray-300 bg-gray-100 text-gray-700 hover:bg-red-100 transition-all duration-150"
        >
          Clear
        </button>
        <button
          onClick={downloadCanvas}
          className="px-3 py-1 rounded font-semibold border border-gray-300 bg-gray-100 text-gray-700 hover:bg-green-100 transition-all duration-150"
        >
          Download
        </button>
        <div className="inline-block space-x-1">
          <button
            onClick={() => exportImage("png")}
            className="px-3 py-1 rounded font-semibold border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all duration-150"
          >Export PNG</button>
          <button
            onClick={() => exportImage("jpeg")}
            className="px-3 py-1 rounded font-semibold border border-pink-300 bg-pink-50 text-pink-700 hover:bg-pink-100 transition-all duration-150"
          >Export JPG</button>
          <button
            onClick={() => exportImage("svg")}
            className="px-3 py-1 rounded font-semibold border border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100 transition-all duration-150"
          >Export SVG</button>
        </div>
        <label className="px-3 py-1 rounded font-semibold border border-gray-300 bg-gray-100 text-gray-700 cursor-pointer hover:bg-blue-100 transition-all duration-150">
          Upload Image
          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
        </label>
        {uploadedImg && (
          <button onClick={commitImageToCanvas} className="px-3 py-1 rounded font-semibold border border-green-400 bg-green-100 text-green-700 hover:bg-green-200 ml-2">Place Image</button>
        )}
      </div>

      {/* Canvas */}
      <div className="relative rounded-2xl shadow-2xl border-4 border-blue-200 bg-white/90 p-2">
        <canvas
          ref={canvasRef}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          className="block mx-auto rounded-xl shadow-lg border border-gray-300 bg-white cursor-crosshair select-none"
        />
        {/* Drag preview for uploaded image */}
        {uploadedImg && imgPos && (
          <img
            src={uploadedImg.src}
            alt="preview"
            style={{
              position: 'absolute',
              left: imgPos.x,
              top: imgPos.y,
              width: imgPreviewSize.width,
              height: imgPreviewSize.height,
              pointerEvents: 'none',
              opacity: 0.7,
              zIndex: 20
            }}
          />
        )}
        {/* Text input overlay */}
        {isPlacingText && textPos && (
          <form
            onSubmit={handleTextSubmit}
            className="absolute z-10"
            style={{ left: textPos.x, top: textPos.y }}
          >
            <input
              autoFocus
              type="text"
              value={textInput}
              onChange={handleTextInput}
              className="border border-blue-400 rounded px-2 py-1 text-base shadow focus:outline-none focus:ring-2 focus:ring-blue-300"
              style={{ minWidth: 80 }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleTextSubmit(e);
                } else if (e.key === "Escape") {
                  setIsPlacingText(false);
                  setTextInput("");
                }
              }}
              onBlur={() => {
                if (textInput.trim() !== "") {
                  handleTextSubmit(new Event('submit', { cancelable: true }));
                } else {
                  setIsPlacingText(false);
                  setTextInput("");
                }
              }}
            />
          </form>
        )}
      </div>
    </div>
  );
};

export default Whiteboard;