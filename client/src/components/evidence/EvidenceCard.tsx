/**
 * مكون عرض شاهد واحد - صورة/رابط/ملف/فيديو
 */
import { Image, FileText, Video, Link as LinkIcon, QrCode, Trash2, Type } from "lucide-react";
import { generateQRDataURL } from "@/lib/qr-utils";
import type { Evidence } from "@/lib/standards-data";

interface Props {
  evidence: Evidence;
  onRemove: (id: string) => void;
  onToggleDisplay?: (id: string) => void;
}

export default function EvidenceCard({ evidence, onRemove, onToggleDisplay }: Props) {
  const ev = evidence;

  return (
    <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 group hover:border-gray-300 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {ev.type === "image" && <Image className="w-4 h-4 text-blue-500" />}
          {ev.type === "link" && <LinkIcon className="w-4 h-4 text-purple-500" />}
          {ev.type === "file" && <FileText className="w-4 h-4 text-orange-500" />}
          {ev.type === "video" && <Video className="w-4 h-4 text-red-500" />}
          {ev.type === "text" && <Type className="w-4 h-4 text-gray-500" />}
          <span className="text-xs font-medium text-gray-700 truncate max-w-[200px]">
            {ev.title}
          </span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {ev.type === "image" && onToggleDisplay && (
            <button
              onClick={() => onToggleDisplay(ev.id)}
              className={`p-1.5 rounded-lg text-xs ${
                ev.displayAs === "qr"
                  ? "bg-violet-100 text-violet-600"
                  : "bg-blue-100 text-blue-600"
              }`}
              title={ev.displayAs === "image" ? "تحويل لباركود QR" : "عرض كصورة"}
            >
              {ev.displayAs === "image" ? (
                <QrCode className="w-3.5 h-3.5" />
              ) : (
                <Image className="w-3.5 h-3.5" />
              )}
            </button>
          )}
          <button
            onClick={() => onRemove(ev.id)}
            className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Preview */}
      {ev.type === "image" && ev.content && (
        ev.displayAs === "image" ? (
          <img src={ev.content} alt={ev.title} className="max-h-32 rounded-lg border border-gray-200" />
        ) : (
          <div className="flex items-center gap-3 bg-violet-50 p-2 rounded-lg">
            <img src={generateQRDataURL(ev.content.substring(0, 200))} alt="QR" className="w-12 h-12" />
            <span className="text-[10px] text-violet-600">سيظهر كباركود QR في الملف</span>
          </div>
        )
      )}

      {ev.type === "link" && ev.content && (
        <div className="flex items-center gap-3 bg-purple-50 p-2 rounded-lg">
          <img src={generateQRDataURL(ev.content)} alt="QR" className="w-12 h-12" />
          <span className="text-[10px] text-purple-600 truncate">{ev.content}</span>
        </div>
      )}

      {ev.type === "video" && (
        <div className="flex items-center gap-3 bg-red-50 p-2 rounded-lg">
          <Video className="w-6 h-6 text-red-500" />
          <div>
            <p className="text-xs font-medium text-gray-700">{ev.title}</p>
            <p className="text-[10px] text-red-500">سيتحول لباركود QR في الملف</p>
          </div>
        </div>
      )}

      {ev.type === "file" && (
        <div className="flex items-center gap-3 bg-orange-50 p-2 rounded-lg">
          <FileText className="w-6 h-6 text-orange-500" />
          <div>
            <p className="text-xs font-medium text-gray-700">{ev.title}</p>
            <p className="text-[10px] text-orange-500">سيتحول لباركود QR في الملف</p>
          </div>
        </div>
      )}
    </div>
  );
}
