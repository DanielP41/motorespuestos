import { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { uploadImagen } from '../../services/api';

interface ImageUploadProps {
    value?: string;
    onChange: (url: string) => void;
    label?: string;
}

export default function ImageUpload({ value, onChange, label = "Imagen del producto" }: ImageUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(value || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Local preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Upload to server
        setUploading(true);
        try {
            const data = await uploadImagen(file);
            onChange(data.url);
        } catch (error) {
            console.error('Upload error:', error);
            alert('Error al subir la imagen. Verificá que sea un archivo válido.');
            setPreview(value || null); // revert
        } finally {
            setUploading(false);
        }
    };

    const removeImage = () => {
        setPreview(null);
        onChange('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="image-upload-container">
            <label className="form-label">{label}</label>

            <div
                className={`image-upload-box ${preview ? 'has-preview' : ''} ${uploading ? 'uploading' : ''}`}
                onClick={() => !uploading && fileInputRef.current?.click()}
            >
                {uploading ? (
                    <div className="upload-overlay">
                        <Loader2 className="spinner" size={24} />
                        <span>Subiendo...</span>
                    </div>
                ) : null}

                {preview ? (
                    <div className="preview-wrap">
                        <img src={preview} alt="Vista previa" className="image-preview" />
                        <button
                            type="button"
                            className="remove-image-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                removeImage();
                            }}
                        >
                            <X size={16} />
                        </button>
                    </div>
                ) : (
                    <div className="upload-placeholder">
                        <Upload size={32} />
                        <p>Hacé click para subir una foto</p>
                        <span className="text-muted">JPG, PNG (Máx 5MB)</span>
                    </div>
                )}
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                style={{ display: 'none' }}
            />

            <style>{`
                .image-upload-container { margin-bottom: 20px; }
                .image-upload-box {
                    width: 100%;
                    height: 200px;
                    border: 2px dashed var(--surface-3);
                    border-radius: var(--radius);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    position: relative;
                    overflow: hidden;
                    transition: all 0.2s;
                    background: var(--surface-2);
                }
                .image-upload-box:hover { border-color: var(--accent); background: var(--surface-3); }
                .image-upload-box.has-preview { border-style: solid; border-color: var(--surface-3); }
                .preview-wrap { width: 100%; height: 100%; position: relative; }
                .image-preview { width: 100%; height: 100%; object-fit: contain; }
                .remove-image-btn {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: rgba(0,0,0,0.6);
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 28px;
                    height: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: transform 0.2s;
                }
                .remove-image-btn:hover { transform: scale(1.1); background: var(--danger); }
                .upload-placeholder { text-align: center; color: var(--muted); }
                .upload-placeholder p { margin: 10px 0 4px; font-weight: 600; color: var(--text); }
                .upload-overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(0,0,0,0.4);
                    backdrop-filter: blur(2px);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    gap: 10px;
                    z-index: 10;
                }
            `}</style>
        </div>
    );
}
