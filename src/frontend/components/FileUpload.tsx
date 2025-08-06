import React, { useState, useRef } from 'react';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  acceptedTypes?: string[];
}

interface UploadedFile {
  file: File;
  preview?: string;
  id: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFilesSelected,
  maxFiles = 5,
  maxSizeMB = 20,
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files: File[]) => {
    const validFiles: UploadedFile[] = [];
    const errors: string[] = [];

    files.forEach(file => {
      // Check file count
      if (uploadedFiles.length + validFiles.length >= maxFiles) {
        errors.push(`Máximo ${maxFiles} archivos permitidos`);
        return;
      }

      // Check file type
      if (!acceptedTypes.includes(file.type)) {
        errors.push(`${file.name}: Tipo de archivo no permitido`);
        return;
      }

      // Check file size
      if (file.size > maxSizeMB * 1024 * 1024) {
        errors.push(`${file.name}: Excede el tamaño máximo de ${maxSizeMB}MB`);
        return;
      }

      // Create preview for images
      let preview: string | undefined;
      if (file.type.startsWith('image/')) {
        preview = URL.createObjectURL(file);
      }

      validFiles.push({
        file,
        preview,
        id: Math.random().toString(36).substr(2, 9)
      });
    });

    if (errors.length > 0) {
      alert(errors.join('\n'));
    }

    if (validFiles.length > 0) {
      const newFiles = [...uploadedFiles, ...validFiles];
      setUploadedFiles(newFiles);
      onFilesSelected(newFiles.map(f => f.file));
    }
  };

  const removeFile = (id: string) => {
    const newFiles = uploadedFiles.filter(f => f.id !== id);
    setUploadedFiles(newFiles);
    onFilesSelected(newFiles.map(f => f.file));
    
    // Revoke object URL to free memory
    const file = uploadedFiles.find(f => f.id === id);
    if (file?.preview) {
      URL.revokeObjectURL(file.preview);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="file-upload-container">
      <div 
        className={`file-upload-dropzone ${dragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleChange}
          style={{ display: 'none' }}
        />
        
        <div className="dropzone-content">
          <svg className="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="dropzone-text">
            <span className="dropzone-text-primary">Haz clic o arrastra archivos aquí</span>
            <span className="dropzone-text-secondary">
              Imágenes (JPG, PNG, GIF, WebP) o PDFs - Máx. {maxSizeMB}MB
            </span>
          </p>
        </div>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="uploaded-files-list">
          {uploadedFiles.map(({ file, preview, id }) => (
            <div key={id} className="uploaded-file-item">
              {preview ? (
                <img src={preview} alt={file.name} className="file-preview-image" />
              ) : (
                <div className="file-preview-pdf">
                  <svg className="pdf-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 18h12V6h-4V2H4v16zm8-12h3.586L12 2.414V6z"/>
                  </svg>
                </div>
              )}
              <div className="file-info">
                <p className="file-name">{file.name}</p>
                <p className="file-size">{formatFileSize(file.size)}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(id);
                }}
                className="file-remove-button"
                title="Eliminar archivo"
              >
                <svg className="remove-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;