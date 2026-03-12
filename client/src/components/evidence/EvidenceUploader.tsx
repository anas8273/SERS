/**
 * مكون رفع الشواهد - زر واحد لرفع صور/ملفات/فيديو/روابط
 */
import { useRef, useState } from "react";
import { Upload, Link as LinkIcon, X, Image, FileText, Video, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Evidence } from "@/lib/standards-data";

interface Props {
  standardId: string;
  indicatorId: string;
  onAdd: (evidence: Omit<Evidence, "id" | "createdAt">) => void;
  isClassifying?: boolean;
}

export default function EvidenceUploader({ standardId, indicatorId, onAdd, isClassifying }: Props) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      onAdd({
        standardId,
        indicatorId,
        type: isImage ? "image" : isVideo ? "video" : "file",
        content: reader.result as string,
        displayAs: isImage ? "image" : "qr",
        title: file.name,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleLink = () => {
    if (!linkUrl.trim()) return;
    onAdd({
      standardId,
      indicatorId,
      type: "link",
      content: linkUrl.trim(),
      displayAs: "qr",
      title: linkTitle.trim() || linkUrl.trim(),
    });
    setLinkUrl("");
    setLinkTitle("");
    setShowLinkInput(false);
  };

  return (
    <div className="space-y-2">
      <input
        type="file"
        ref={fileRef}
        className="hidden"
        accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
        onChange={handleFile}
      />

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => fileRef.current?.click()}
          disabled={isClassifying}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-dashed border-teal-300 text-teal-600 hover:bg-teal-50 text-xs font-medium transition-colors disabled:opacity-50"
        >
          {isClassifying ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          {isClassifying ? "جاري التصنيف..." : "رفع شاهد"}
        </button>

        <button
          onClick={() => setShowLinkInput(!showLinkInput)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-dashed border-purple-300 text-purple-600 hover:bg-purple-50 text-xs font-medium transition-colors"
        >
          <LinkIcon className="w-4 h-4" />
          إضافة رابط
        </button>
      </div>

      <AnimatePresence>
        {showLinkInput && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-purple-50 rounded-xl p-3 border border-purple-200 space-y-2">
              <input
                type="text"
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                placeholder="عنوان الرابط (اختياري)"
                className="w-full px-3 py-2 rounded-lg border border-purple-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 bg-white"
              />
              <div className="flex gap-2">
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://..."
                  dir="ltr"
                  className="flex-1 px-3 py-2 rounded-lg border border-purple-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 bg-white"
                  onKeyDown={(e) => { if (e.key === "Enter") handleLink(); }}
                />
                <button
                  onClick={handleLink}
                  className="px-4 py-2 rounded-lg bg-purple-600 text-white text-xs font-medium hover:bg-purple-700"
                >
                  إضافة
                </button>
                <button
                  onClick={() => { setShowLinkInput(false); setLinkUrl(""); setLinkTitle(""); }}
                  className="p-2 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
