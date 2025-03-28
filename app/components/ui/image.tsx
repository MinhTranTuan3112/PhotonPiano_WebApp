import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

type Props = {
  src: string;
  alt?: string;
  className?: string;
  previewable?: boolean;
};

export default function Image({
  src,
  alt = 'Image',
  className = '',
  previewable = true,
}: Props) {
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [isBrowser, setIsBrowser] = useState(false);

  useEffect(() => {
    setIsBrowser(typeof window !== 'undefined' && typeof document !== 'undefined');
  }, []);

  const handleOpenPreview = () => {
    if (previewable) {
      setIsPreviewVisible(true);
    }
  };
  const handleClosePreview = () => setIsPreviewVisible(false);

  const modalContent = isPreviewVisible ? (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      onClick={handleClosePreview}
    >
      <div className="relative animate-jump-in">
        <button
          className="absolute top-2 right-2 text-white text-2xl font-bold"
          onClick={handleClosePreview}
        >
          &times;
        </button>
        <img
          src={src}
          alt={alt}
          className="w-auto h-auto max-w-full max-h-screen object-contain"
        />
      </div>
    </div>
  ) : null;

  return (
    <>
      {/* Thumbnail Image */}
      <img
        src={src}
        alt={alt}
        className={`cursor-pointer rounded-lg ${className}`}
        onClick={handleOpenPreview}
      />

      {/* Render Modal with Portals */}
      {isBrowser && createPortal(modalContent, document.body)}
    </>
  );
}
