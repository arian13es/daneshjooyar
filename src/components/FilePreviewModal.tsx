import React, { useEffect } from "react";
import { motion } from "motion/react";
import { X, Download, FileText, Image as ImageIcon } from "lucide-react";

interface FilePreviewModalProps {
  file: {
    url: string;
    name: string;
    type: string;
  };
  onClose: () => void;
}

export default function FilePreviewModal({ file, onClose }: FilePreviewModalProps) {
  const isImage = file.type.startsWith("image/");

  // Revoke blob URL when modal closes/unmounts to free memory early.
  // FileHelper also schedules a 120s safety-net revoke; double-revoke is safe.
  useEffect(() => {
    return () => {
      if (file.url && file.url.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(file.url);
        } catch {
          /* already revoked */
        }
      }
    };
  }, [file.url]);

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = file.url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="fixed inset-0 z-[350] bg-black/90 backdrop-blur-md flex flex-col font-sans select-none"
      dir="rtl"
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between px-5 py-4 bg-black/40 border-b border-white/10 shrink-0 text-white pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-3 min-w-0 pr-1">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0 text-amber-400">
            {isImage ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-black truncate text-white">{file.name}</p>
            <p className="text-[10px] text-white/60 font-bold mt-0.5">مشاهده درون‌برنامه‌ای</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            title="دانلود / ذخیره فایل"
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <Download className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Preview Container */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-3 sm:p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {isImage ? (
          <img
            src={file.url}
            alt={file.name}
            className="max-h-[82vh] max-w-full object-contain rounded-2xl shadow-2xl transition-transform"
          />
        ) : (
          <div className="text-center p-8 bg-white/5 rounded-3xl border border-white/10 max-w-sm">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8" />
            </div>
            <p className="text-sm font-black text-white mb-2">{file.name}</p>
            <p className="text-xs text-white/60 mb-6 leading-relaxed">
              برای مشاهده کامل این فایل می‌توانید آن را در حافظه گوشی ذخیره کنید یا با برنامه خارجی باز کنید.
            </p>
            <button
              onClick={handleDownload}
              className="w-full py-3 bg-amber-500 text-white rounded-xl font-black text-xs hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" /> دریافت فایل
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
