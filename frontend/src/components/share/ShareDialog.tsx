'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { cn } from '@/lib/utils';
import {
  Share2,
  Copy,
  Check,
  Twitter,
  Facebook,
  Linkedin,
  Mail,
  MessageCircle,
  Link2,
  QrCode,
} from 'lucide-react';

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string;
  description?: string;
  image?: string;
}

const socialPlatforms = [
  {
    name: 'تويتر',
    icon: <Twitter className="w-5 h-5" />,
    color: 'bg-[#1DA1F2] hover:bg-[#1a8cd8]',
    getUrl: (url: string, title: string) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  {
    name: 'فيسبوك',
    icon: <Facebook className="w-5 h-5" />,
    color: 'bg-[#1877F2] hover:bg-[#166fe5]',
    getUrl: (url: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    name: 'لينكدإن',
    icon: <Linkedin className="w-5 h-5" />,
    color: 'bg-[#0A66C2] hover:bg-[#095196]',
    getUrl: (url: string, title: string) =>
      `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
  },
  {
    name: 'واتساب',
    icon: <MessageCircle className="w-5 h-5" />,
    color: 'bg-[#25D366] hover:bg-[#20bd5a]',
    getUrl: (url: string, title: string) =>
      `https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`,
  },
  {
    name: 'البريد',
    icon: <Mail className="w-5 h-5" />,
    color: 'bg-gray-600 hover:bg-gray-700',
    getUrl: (url: string, title: string, description?: string) =>
      `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${description || title}\n\n${url}`)}`,
  },
];

export function ShareDialog({
  isOpen,
  onClose,
  title,
  url,
  description,
  image,
}: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleShare = (platform: (typeof socialPlatforms)[0]) => {
    const shareUrl = platform.getUrl(url, title, description);
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url,
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="مشاركة" size="md">
      <div className="space-y-6">
        {/* Preview Card */}
        <div className="flex gap-4 p-4 bg-muted/50 rounded-lg">
          {image && (
            <img
              src={image}
              alt={title}
              className="w-20 h-20 object-cover rounded-lg"
            />
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium line-clamp-1">{title}</h4>
            {description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Copy Link */}
        <div>
          <label className="block text-sm font-medium mb-2">رابط المشاركة</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={url}
              readOnly
              className="flex-1 p-2 rounded-lg border bg-background text-sm"
            />
            <Button
              variant="outline"
              onClick={handleCopy}
              className="flex-shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 ml-2 text-green-500" />
                  تم النسخ
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 ml-2" />
                  نسخ
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Social Platforms */}
        <div>
          <label className="block text-sm font-medium mb-3">
            مشاركة عبر
          </label>
          <div className="grid grid-cols-5 gap-3">
            {socialPlatforms.map((platform) => (
              <button
                key={platform.name}
                onClick={() => handleShare(platform)}
                className={cn(
                  'flex flex-col items-center gap-2 p-3 rounded-lg text-white transition-colors',
                  platform.color
                )}
                title={platform.name}
              >
                {platform.icon}
                <span className="text-xs">{platform.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* QR Code */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <QrCode className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm">مشاركة عبر رمز QR</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowQR(!showQR)}>
            {showQR ? 'إخفاء' : 'عرض'}
          </Button>
        </div>

        {showQR && (
          <div className="flex justify-center p-4 bg-white rounded-lg">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`}
              alt="QR Code"
              className="w-48 h-48"
            />
          </div>
        )}

        {/* Native Share (if supported) */}
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <Button onClick={handleNativeShare} className="w-full">
            <Share2 className="w-4 h-4 ml-2" />
            مشاركة
          </Button>
        )}
      </div>
    </Modal>
  );
}
