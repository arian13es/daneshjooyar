import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { motion, AnimatePresence } from 'motion/react';
import { getCroppedImg } from '../utils/cropImage';
import { X, Check } from 'lucide-react';

interface ImageCropModalProps {
  imageSrc: string;
  onClose: () => void;
  onSave: (croppedImage: string) => void;
  onRemove?: () => void;
  hasExistingAvatar?: boolean;
}

export default function ImageCropModal({ imageSrc, onClose, onSave, onRemove, hasExistingAvatar }: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropComplete = useCallback((_croppedArea: unknown, areaPixels: { x: number; y: number; width: number; height: number }) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleSave = async () => {
    try {
      if (!croppedAreaPixels) return;
      setIsProcessing(true);
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      onSave(croppedImage);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="crop-modal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] bg-black flex flex-col"
        dir="rtl"
      >
        <div className="flex items-center justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))] bg-slate-900 text-white z-10 relative shadow-md">
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-800 transition-colors">
            <X className="h-6 w-6" />
          </button>
          <span className="font-black text-sm">تنظیم عکس پروفایل</span>
          <button 
            onClick={handleSave} 
            disabled={isProcessing}
            className="p-2 bg-indigo-600 rounded-full hover:bg-indigo-500 transition-colors disabled:opacity-50"
          >
            <Check className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 relative w-full h-full">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="rect"
            showGrid={false}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
            classes={{
              containerClassName: "bg-black",
            }}
          />
        </div>

        <div className="bg-slate-900 p-6 pb-[max(2rem,env(safe-area-inset-bottom))] z-10 relative flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <span className="text-xs font-black text-slate-400">کوچک</span>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-indigo-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-xs font-black text-slate-400">بزرگ</span>
          </div>

          {hasExistingAvatar && onRemove && (
            <button
              onClick={() => { onRemove(); onClose(); }}
              className="w-full py-4 text-rose-500 bg-rose-500/10 rounded-2xl text-sm font-black hover:bg-rose-500/20 transition-colors border border-rose-500/20 active:scale-95"
            >
              حذف عکس فعلی
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
