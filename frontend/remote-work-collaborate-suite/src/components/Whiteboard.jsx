// src/components/Whiteboard.jsx
import React, { useRef, useEffect, useState } from "react";
import jsPDF from "jspdf";

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

  // Image upload and drag state
  const [uploadedImg, setUploadedImg] = useState(null);
  const [imgPos, setImgPos] = useState(null); // {x, y}
  const [isDraggingImg, setIsDraggingImg] = useState(false);
  const [imgOffset, setImgOffset] = useState({ x: 0, y: 0 });
  const [imgPreviewSize, setImgPreviewSize] = useState({ width: 200, height: 200 }); // default preview size

  // Color palette customization and eyedropper tool
  const [customColors, setCustomColors] = useState([...colors.slice(0, 7)]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [newColor, setNewColor] = useState('#000000');
  const [isEyedropper, setIsEyedropper] = useState(false);

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

  // Export canvas as PDF
  const exportAsPDF = () => {
    const canvas = canvasRef.current;
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [canvas.width, canvas.height] });
    pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
    pdf.save("whiteboard.pdf");
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

  // Touch support: handle both mouse and touch events
  const handlePointerDown = (e) => {
    if (isEyedropper) {
      handleEyedropper(e);
      return;
    }
    if (e.type === 'touchstart') {
      e.preventDefault();
      startDrawing(e);
    } else {
      handleCanvasMouseDown(e);
    }
  };
  const handlePointerMove = (e) => {
    if (e.type === 'touchmove') {
      e.preventDefault();
      handleCanvasMouseMove(e);
    } else {
      handleCanvasMouseMove(e);
    }
  };
  const handlePointerUp = (e) => {
    if (e.type === 'touchend') {
      e.preventDefault();
      handleCanvasMouseUp(e);
    } else {
      handleCanvasMouseUp(e);
    }
  };

  // Eyedropper tool logic
  const handleEyedropper = (e) => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    const { x, y } = getMousePos(e);
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const hex = '#' + ((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1);
    setColor(hex);
    setIsEyedropper(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex flex-col items-center justify-start py-10 px-2">
      <div className="w-full max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-500 to-pink-400 drop-shadow-lg select-none text-center md:text-left">
            🎨 Whiteboard
          </h1>
          <div className="flex flex-wrap gap-3 items-center justify-center md:justify-end">
            <select
              value={tool}
              onChange={e => setTool(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base font-semibold bg-white shadow-sm transition-all duration-150"
            >
              <option value="pen">Pen</option>
              <option value="rect">Rectangle</option>
              <option value="circle">Circle</option>
              <option value="line">Line</option>
              <option value="arrow">Arrow</option>
            </select>
            <select
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              value={brushSize}
              className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base font-semibold bg-white shadow-sm transition-all duration-150"
            >
              {brushSizes.map((size) => (
                <option key={size} value={size}>{size}px</option>
              ))}
            </select>
            <div className="flex gap-1 flex-wrap">
              {customColors.map((c, idx) => (
                <button
                  key={c + idx}
                  className={`w-8 h-8 rounded-full border-2 transition-all duration-150 ${color === c && !isEraser ? 'border-blue-600 scale-110 shadow-lg' : 'border-gray-300'} hover:scale-110`}
                  style={{ backgroundColor: c }}
                  onClick={() => { setColor(c); setIsEraser(false); }}
                />
              ))}
              <button
                className="w-8 h-8 rounded-full border-2 border-dashed border-gray-400 flex items-center justify-center bg-white text-gray-500 hover:bg-blue-50"
                onClick={() => setShowColorPicker(true)}
                title="Add custom color"
              >+
              </button>
              <button
                className={`w-8 h-8 rounded-full border-2 border-gray-400 flex items-center justify-center bg-white text-gray-700 hover:bg-blue-100 ${isEyedropper ? 'ring-2 ring-blue-400' : ''}`}
                onClick={() => setIsEyedropper(!isEyedropper)}
                title="Eyedropper"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 13.5V19a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2h5.5" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 3l6 6m-6-6v6h6" />
                </svg>
              </button>
            </div>
            {showColorPicker && (
              <div className="absolute z-30 bg-white border border-gray-300 rounded-lg shadow-lg p-4 flex flex-col gap-2 top-20 left-1/2 -translate-x-1/2 w-64">
                <label className="font-semibold mb-2">Pick a color:</label>
                <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} className="w-full h-12 rounded" />
                <button
                  className="mt-2 px-4 py-2 rounded-lg font-semibold border border-blue-400 bg-blue-100 text-blue-700 hover:bg-blue-200"
                  onClick={() => {
                    setCustomColors(prev => {
                      const updated = [...prev, newColor];
                      return updated.length > 7 ? updated.slice(1) : updated;
                    });
                    setShowColorPicker(false);
                  }}
                >Add Color</button>
                <button
                  className="mt-1 px-4 py-2 rounded-lg font-semibold border border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200"
                  onClick={() => setShowColorPicker(false)}
                >Cancel</button>
              </div>
            )}
            <button
              onClick={() => setIsEraser(!isEraser)}
              className={`px-4 py-2 rounded-lg font-semibold border transition-all duration-150 ${isEraser ? 'bg-red-100 border-red-400 text-red-700' : 'bg-gray-100 border-gray-300 text-gray-700'} hover:bg-red-200`}
            >
              {isEraser ? "Eraser ON" : "Eraser OFF"}
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 items-center justify-center md:justify-between mb-6">
          <div className="flex gap-2">
            <button
              onClick={handleUndo}
              className="px-4 py-2 rounded-lg font-semibold border border-yellow-400 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition-all duration-150"
            >
              Undo
            </button>
            <button
              onClick={clearCanvas}
              className="px-4 py-2 rounded-lg font-semibold border border-red-400 bg-red-100 text-red-700 hover:bg-red-200 transition-all duration-150"
            >
              Clear
            </button>
            <button
              onClick={downloadCanvas}
              className="px-4 py-2 rounded-lg font-semibold border border-green-400 bg-green-100 text-green-700 hover:bg-green-200 transition-all duration-150"
            >
              Download
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => exportImage("png")}
              className="px-4 py-2 rounded-lg font-semibold border border-blue-400 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all duration-150"
            >Export PNG</button>
            <button
              onClick={() => exportImage("jpeg")}
              className="px-4 py-2 rounded-lg font-semibold border border-pink-400 bg-pink-50 text-pink-700 hover:bg-pink-100 transition-all duration-150"
            >Export JPG</button>
            <button
              onClick={() => exportImage("svg")}
              className="px-4 py-2 rounded-lg font-semibold border border-purple-400 bg-purple-50 text-purple-700 hover:bg-purple-100 transition-all duration-150"
            >Export SVG</button>
            <button
              onClick={exportAsPDF}
              className="px-4 py-2 rounded-lg font-semibold border border-red-400 bg-red-50 text-red-700 hover:bg-red-100 transition-all duration-150"
            >Export PDF</button>
          </div>
          <div className="flex gap-2 items-center">
            <label className="px-4 py-2 rounded-lg font-semibold border border-blue-400 bg-blue-50 text-blue-700 cursor-pointer hover:bg-blue-100 transition-all duration-150">
              Upload Image
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
            {uploadedImg && (
              <button onClick={commitImageToCanvas} className="px-4 py-2 rounded-lg font-semibold border border-green-400 bg-green-100 text-green-700 hover:bg-green-200 ml-2">Place Image</button>
            )}
          </div>
        </div>
        <div className="relative rounded-3xl shadow-2xl border-4 border-blue-200 bg-white/90 p-4 flex items-center justify-center min-h-[500px] max-h-[700px] overflow-auto touch-pan-x touch-pan-y">
          <canvas
            ref={canvasRef}
            onMouseDown={handlePointerDown}
            onTouchStart={handlePointerDown}
            onMouseMove={handlePointerMove}
            onTouchMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onTouchEnd={handlePointerUp}
            onMouseLeave={handlePointerUp}
            className="block mx-auto rounded-2xl shadow-lg border border-gray-300 bg-white cursor-crosshair select-none min-w-[800px] min-h-[500px]"
            style={{ maxWidth: '1600px', maxHeight: '1200px' }}
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
        </div>
      </div>
    </div>
  );
};

export default Whiteboard;



/*

*/