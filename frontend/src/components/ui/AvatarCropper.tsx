import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { motion, AnimatePresence } from 'framer-motion';
import { PixelCard } from './PixelCard';
import { PixelButton } from './PixelButton';
import getCroppedImg from '../../utils/canvasUtils';
import { X, Upload, Check } from 'lucide-react';

interface AvatarCropperProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (croppedImage: Blob) => void;
}

export function AvatarCropper({ isOpen, onClose, onSave }: AvatarCropperProps) {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    

    const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const imageDataUrl = await readFile(file);
            setImageSrc(imageDataUrl as string);
        }
    };

    const handleSave = async () => {
        if (!imageSrc || !croppedAreaPixels) return;
        try {
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
            if (croppedImage) {
                onSave(croppedImage);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const readFile = (file: File) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.addEventListener('load', () => resolve(reader.result), false);
            reader.readAsDataURL(file);
        });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="w-full max-w-md"
                    >
                        <PixelCard className="relative overflow-hidden" color="#e2e8f0">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="font-press text-sm text-slate-700">EDITAR AVATAR</h2>
                                <button onClick={onClose} className="text-slate-400 hover:text-red-500">
                                    <X size={20} />
                                </button>
                            </div>

                            {!imageSrc ? (
                                <div className="h-64 border-2 border-dashed border-slate-400 bg-slate-100 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-slate-200 transition-colors relative">
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={handleFileChange}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                    <div className="w-16 h-16 bg-slate-300 rounded-full flex items-center justify-center">
                                        <Upload className="text-slate-500" />
                                    </div>
                                    <span className="font-press text-xs text-slate-500">CLIQUE PARA UPLOAD</span>
                                </div>
                            ) : (
                                <>
                                    <div className="relative h-64 w-full bg-slate-900 border-2 border-slate-700 mb-4">
                                        <Cropper
                                            image={imageSrc}
                                            crop={crop}
                                            zoom={zoom}
                                            aspect={1}
                                            cropShape="round"
                                            showGrid={false}
                                            onCropChange={setCrop}
                                            onCropComplete={onCropComplete}
                                            onZoomChange={setZoom}
                                        />
                                    </div>
                                    
                                    <div className="flex items-center gap-2 mb-4 px-2">
                                        <span className="font-press text-[8px] text-slate-500">ZOOM</span>
                                        <input
                                            type="range"
                                            value={zoom}
                                            min={1}
                                            max={3}
                                            step={0.1}
                                            aria-labelledby="Zoom"
                                            onChange={(e) => setZoom(Number(e.target.value))}
                                            className="w-full h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                                        />
                                    </div>

                                    <div className="flex gap-2">
                                        <PixelButton 
                                            variant="secondary" 
                                            onClick={() => setImageSrc(null)}
                                            className="flex-1"
                                        >
                                            TROCAR
                                        </PixelButton>
                                        <PixelButton 
                                            onClick={handleSave} 
                                            className="flex-1 bg-green-500 border-green-700 hover:bg-green-400 text-white"
                                        >
                                            <Check size={16} className="mr-2" /> SALVAR
                                        </PixelButton>
                                    </div>
                                </>
                            )}
                        </PixelCard>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}