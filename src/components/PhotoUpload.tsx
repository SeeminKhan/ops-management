import { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';

interface PhotoUploadProps {
  onPhotosChange: (files: File[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
}

export default function PhotoUpload({ 
  onPhotosChange, 
  maxFiles = 3, 
  maxSizeMB = 5 
}: PhotoUploadProps) {
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    setError('');

    // Validate file count
    if (photos.length + files.length > maxFiles) {
      setError(`Maximum ${maxFiles} photos allowed`);
      return;
    }

    // Validate and process files
    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    for (const file of files) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError(`${file.name} is not an image file`);
        continue;
      }

      // Validate file size
      if (file.size > maxSizeBytes) {
        setError(`${file.name} exceeds ${maxSizeMB}MB limit`);
        continue;
      }

      validFiles.push(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        if (newPreviews.length === validFiles.length) {
          setPreviews([...previews, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    }

    if (validFiles.length > 0) {
      const updatedPhotos = [...photos, ...validFiles];
      setPhotos(updatedPhotos);
      onPhotosChange(updatedPhotos);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function removePhoto(index: number) {
    const updatedPhotos = photos.filter((_, i) => i !== index);
    const updatedPreviews = previews.filter((_, i) => i !== index);
    setPhotos(updatedPhotos);
    setPreviews(updatedPreviews);
    onPhotosChange(updatedPhotos);
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="p-2 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Preview Grid */}
      {previews.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {previews.map((preview, index) => (
            <div key={index} className="relative group">
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border border-benne-border"
              />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove photo"
              >
                <X size={16} />
              </button>
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
                {(photos[index].size / 1024).toFixed(0)} KB
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {photos.length < maxFiles && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id="photo-upload"
          />
          <label
            htmlFor="photo-upload"
            className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-benne-border rounded-lg cursor-pointer hover:border-benne-gold hover:bg-benne-cream/50 transition-colors"
          >
            <Upload size={20} className="text-benne-brown-muted" />
            <span className="text-sm text-benne-brown-muted">
              Add photos ({photos.length}/{maxFiles}) • Max {maxSizeMB}MB each
            </span>
          </label>
        </div>
      )}

      <p className="text-xs text-benne-brown-muted">
        Accepted formats: JPEG, PNG, WebP • Maximum {maxFiles} photos
      </p>
    </div>
  );
}
