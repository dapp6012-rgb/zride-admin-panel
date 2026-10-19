import { useEffect, useState } from 'react';

const clampZoom = (zoom) => Math.min(3, Math.max(0.5, zoom));

export default function GlobalImageViewer({ images = [], initialIndex = 0, isOpen, onClose }) {
  const [index, setIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState(null);
  const image = images[index];

  useEffect(() => {
    if (!isOpen) return;
    setIndex(Math.min(Math.max(initialIndex, 0), Math.max(images.length - 1, 0)));
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
    setDragStart(null);
  }, [images, initialIndex, isOpen]);

  if (!isOpen || !image) return null;

  const changeImage = (direction) => {
    setIndex((current) => (current + direction + images.length) % images.length);
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const startDrag = (event) => {
    if (zoom <= 1) return;
    event.preventDefault();
    setDragStart({ x: event.clientX - position.x, y: event.clientY - position.y });
  };

  const moveDrag = (event) => {
    if (!dragStart) return;
    setPosition({ x: event.clientX - dragStart.x, y: event.clientY - dragStart.y });
  };

  const stopDrag = () => setDragStart(null);

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative flex h-full w-full flex-col items-center justify-center"
        onClick={(event) => {
          event.stopPropagation();
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <div className="absolute right-0 top-0 z-10 flex flex-wrap justify-end gap-2">
          <a
            href={image}
            download
            className="rounded-lg bg-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/25"
          >
            Download HD
          </a>
          <button type="button" onClick={() => setZoom((current) => clampZoom(current + 0.25))} className="rounded-lg bg-white/15 px-4 py-2 text-white hover:bg-white/25" aria-label="Zoom in">+</button>
          <button type="button" onClick={() => setZoom((current) => clampZoom(current - 0.25))} className="rounded-lg bg-white/15 px-4 py-2 text-white hover:bg-white/25" aria-label="Zoom out">−</button>
          <button type="button" onClick={() => setRotation((current) => (current + 90) % 360)} className="rounded-lg bg-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/25">Rotate</button>
          <button type="button" onClick={onClose} className="rounded-lg bg-white/15 px-4 py-2 text-xl leading-5 text-white hover:bg-white/25" aria-label="Close image viewer">×</button>
        </div>

        {images.length > 1 && (
          <>
            <button type="button" onClick={() => changeImage(-1)} className="absolute left-0 z-10 rounded-full bg-white/15 px-4 py-3 text-2xl text-white hover:bg-white/25" aria-label="Previous image">‹</button>
            <button type="button" onClick={() => changeImage(1)} className="absolute right-0 z-10 rounded-full bg-white/15 px-4 py-3 text-2xl text-white hover:bg-white/25" aria-label="Next image">›</button>
          </>
        )}

        <img
          src={image}
          alt=""
          draggable="false"
          onWheel={(event) => {
            event.preventDefault();
            setZoom((current) => clampZoom(current + (event.deltaY < 0 ? 0.1 : -0.1)));
          }}
          onMouseDown={startDrag}
          onMouseMove={moveDrag}
          onMouseUp={stopDrag}
          onMouseLeave={stopDrag}
          className={`max-h-[85vh] max-w-[90vw] select-none object-contain ${zoom > 1 ? (dragStart ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'}`}
          style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)` }}
        />
        {images.length > 1 && (
          <p className="absolute bottom-2 text-sm text-white/70">{index + 1} / {images.length}</p>
        )}
      </div>
    </div>
  );
}
