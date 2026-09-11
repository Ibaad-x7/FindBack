import React, { useEffect, useRef, useState } from "react";
import { AlertCircle, Loader2, UploadCloud, X } from "lucide-react";
import { uploadApi } from "../lib/api";

interface ImageUploadProps {
  value?: string | null;
  onChange: (imageUrl: string | null) => void;
  className?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function ImageUpload({ value, onChange, className = "" }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setPreviewUrl(value || null);
  }, [value]);

  const handleFile = async (file: File) => {
    setError(null);

    // Validate MIME type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Invalid file type. Only JPG, PNG, and WebP images are allowed.");
      return;
    }

    // Validate size (5MB)
    if (file.size > MAX_FILE_SIZE) {
      setError("File size exceeds 5MB. Please choose a smaller image.");
      return;
    }

    // Generate local preview immediately
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setIsUploading(true);

    try {
      const result = await uploadApi.uploadImage(file);
      onChange(result.imageUrl);
      setPreviewUrl(result.imageUrl);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to upload image. Please try again.");
      }
      setPreviewUrl(null);
      onChange(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl(null);
    setError(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleInputChange}
        className="hidden"
      />

      {previewUrl ? (
        <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50 aspect-video flex items-center justify-center">
          <img
            src={previewUrl}
            alt="Uploaded item preview"
            className="h-full w-full object-cover"
          />

          {isUploading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white backdrop-blur-xs">
              <Loader2 size={24} className="animate-spin" />
              <span className="mt-2 text-xs font-medium">Uploading image...</span>
            </div>
          )}

          {!isUploading && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white shadow hover:bg-black/80 transition-colors"
              title="Remove image"
            >
              <X size={14} />
            </button>
          )}
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
            isDragging
              ? "border-brand-500 bg-brand-50/50"
              : "border-gray-300 hover:border-brand-400 bg-gray-50/50 hover:bg-gray-50"
          }`}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600 mb-3">
            {isUploading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <UploadCloud size={20} />
            )}
          </div>

          <p className="text-sm font-semibold text-gray-700">
            Click to upload photo <span className="text-gray-500 font-normal">or drag & drop</span>
          </p>
          <p className="mt-1 text-xs text-gray-500">
            JPEG, PNG, or WebP (Max 5MB)
          </p>
        </div>
      )}

      {error && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600">
          <AlertCircle size={14} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
