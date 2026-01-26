import React, { useCallback, useState, useEffect } from 'react';
import { Upload, Image as ImageIcon, ClipboardPaste } from 'lucide-react';

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

  // Handle paste events globally
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
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [disabled, onImageSelected]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative group cursor-pointer
        border-2 border-dashed rounded-xl p-10
        transition-all duration-300 ease-in-out
        flex flex-col items-center justify-center text-center
        min-h-[300px]
        ${isDragging 
          ? 'border-indigo-500 bg-indigo-50 scale-[1.02] shadow-xl' 
          : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50 bg-white'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
      `}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        disabled={disabled}
      />
      
      <div className={`
        w-20 h-20 rounded-full mb-6 flex items-center justify-center
        transition-colors duration-300
        ${isDragging ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600'}
      `}>
        {isDragging ? <Upload size={40} /> : <ImageIcon size={40} />}
      </div>

      <h3 className="text-xl font-semibold text-slate-700 mb-2">
        {isDragging ? 'Drop it here!' : 'Upload Event Invitation'}
      </h3>
      
      <p className="text-slate-500 max-w-sm mb-6">
        Drag and drop an image file here, or click to browse.
      </p>

      <div className="flex items-center gap-2 text-sm text-slate-400 bg-slate-100 px-4 py-2 rounded-full">
        <ClipboardPaste size={16} />
        <span>Tip: You can also paste (Ctrl+V) an image directly!</span>
      </div>
    </div>
  );
};

export default ImageDropzone;
