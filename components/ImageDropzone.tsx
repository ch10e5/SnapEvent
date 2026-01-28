import React, { useCallback, useState, useEffect } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';

interface ImageDropzoneProps {
  onImageSelected: (file: File) => void;
  disabled?: boolean;
}

const ImageDropzone: React.FC<ImageDropzoneProps> = ({ onImageSelected, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        onImageSelected(file);
      }
    }
  }, [disabled, onImageSelected]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (e.target.files && e.target.files.length > 0) {
      onImageSelected(e.target.files[0]);
    }
  }, [disabled, onImageSelected]);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (disabled) return;
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        const file = e.clipboardData.files[0];
        if (file.type.startsWith('image/')) {
          onImageSelected(file);
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [disabled, onImageSelected]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative group cursor-pointer
        bg-slate-50 rounded-3xl
        border-4 border-dashed
        transition-all duration-200 ease-out
        flex flex-col items-center justify-center text-center
        aspect-[4/5] w-full max-w-sm mx-auto
        overflow-hidden
        ${isDragging ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-300 hover:border-indigo-300 hover:bg-slate-100'}
        ${disabled ? 'opacity-50 pointer-events-none' : ''}
      `}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        disabled={disabled}
      />
      
      {/* Flat Illustration Icon */}
      <div className={`
        relative z-20 w-24 h-24 rounded-full mb-6 flex items-center justify-center
        transition-colors duration-200
        ${isDragging ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-600 group-hover:bg-indigo-200'}
      `}>
        {isDragging ? <Upload size={40} /> : <ImageIcon size={40} />}
      </div>

      <h3 className="relative z-20 text-2xl font-bold text-slate-800 mb-2 group-hover:text-indigo-700 transition-colors">
        Tap to Upload
      </h3>
      
      <p className="relative z-20 text-slate-500 px-8 text-sm group-hover:text-slate-600">
        or drag and drop your image here
      </p>

      <div className="absolute bottom-8 text-xs font-bold text-slate-300 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
        Paste from Clipboard
      </div>
    </div>
  );
};

export default ImageDropzone;