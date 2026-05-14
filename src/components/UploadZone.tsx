import { useCallback, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface UploadZoneProps {
  onUpload: (file: File) => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onUpload }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUpload(e.dataTransfer.files[0]);
    }
  }, [onUpload]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files[0]);
    }
  }, [onUpload]);

  return (
    <div 
      className={twMerge(
        "flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-2xl transition-all duration-200 shadow-sm",
        isDragging ? "border-accent-purple bg-indigo-50" : "border-slate-300 bg-white hover:border-accent-purple hover:bg-slate-50"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center pt-5 pb-6">
        <UploadCloud className="w-14 h-14 mb-4 text-accent-purple" />
        <p className="mb-2 text-lg text-slate-700 font-semibold">
          Drop your execution Excel sheet here
        </p>
        <p className="text-sm text-slate-500">
          or click to browse from your computer
        </p>
      </div>
      <input 
        id="dropzone-file" 
        type="file" 
        className="hidden" 
        accept=".xlsx, .xls, .csv" 
        onChange={handleChange}
      />
      <label htmlFor="dropzone-file" className="px-6 py-2.5 mt-2 text-sm font-semibold text-white bg-accent-purple hover:bg-indigo-600 rounded-lg cursor-pointer transition-colors shadow-md shadow-accent-purple/20">
        Browse Files
      </label>
    </div>
  );
};
