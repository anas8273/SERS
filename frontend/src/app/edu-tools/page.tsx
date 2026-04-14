'use client';
import { ta } from '@/i18n/auto-translations';

import { useState, useRef } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, ChevronRight, QrCode, Youtube, Calculator, Image as ImageIcon, FileText, Download, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTranslation } from '@/i18n/useTranslation';

// ===== QR Code Tool =====
function QRCodeTool({ onBack }: { onBack: () => void }) {
  const { dir } = useTranslation();
    const [url, setUrl] = useState('');
    const qrUrl = url ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}` : '';

    return (
        <ToolLayout title={ta('حول أي رابط إلى QR Code', 'Convert any link to a QR Code')} desc="أداة مجانية لتحويل أي رابط إلى رمز QR قابل للطباعة والمشاركة" gradient="from-gray-600 to-slate-700" icon={QrCode} onBack={onBack}>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{ta('الرابط', 'Link')}</label>
                    <Input placeholder="https://..." value={url} onChange={e => setUrl(e.target.value)} />
                </div>
                {qrUrl && (
                    <div className="text-center space-y-3">
                        <img src={qrUrl} alt="QR Code" className="mx-auto rounded-xl border shadow-lg w-48 h-48" />
                        <div className="flex gap-2 justify-center">
                            <a href={qrUrl} download="qrcode.png">
                                <Button className="gap-2 bg-gradient-to-l from-gray-600 to-slate-700 text-white border-0">
                                    <Download className="w-4 h-4" /> {ta('تحميل QR', 'Download QR')}
                                </Button>
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </ToolLayout>
    );
}

// ===== vCard QR Tool =====
function VCardTool({ onBack }: { onBack: () => void }) {
    const [v, setV] = useState({ name: '', phone: '', email: '', school: '', title: '' });
    const set = (k: string, val: string) => setV(p => ({ ...p, [k]: val }));
    const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${v.name}\nTEL:${v.phone}\nEMAIL:${v.email}\nORG:${v.school}\nTITLE:${v.title}\nEND:VCARD`;
    const qrUrl = v.name ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(vcard)}` : '';

    return (
        <ToolLayout title={ta('QR Code بطاقة التواصل', 'Contact Card QR Code')} desc="أداة لإنشاء رمز QR لبطاقة التواصل الشخصية (vCard)" gradient="from-indigo-600 to-blue-700" icon={QrCode} onBack={onBack}>
            <div className="space-y-4">
                {[['name','الاسم الكامل','اسمك الكامل'],['title','المسمى الوظيفي','معلم / مدير مدرسة'],['school','المدرسة / الجهة','اسم المدرسة'],['phone','رقم الجوال','05xxxxxxxx'],['email','البريد الإلكتروني','example@edu.sa']].map(([k,l,ph]) => (
                    <div key={k}>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{l}</label>
                        <Input placeholder={ph} value={(v as any)[k]} onChange={e => set(k, e.target.value)} />
                    </div>
                ))}
                {qrUrl && (
                    <div className="text-center space-y-3">
                        <img src={qrUrl} alt="vCard QR" className="mx-auto rounded-xl border shadow-lg w-48 h-48" />
                        <a href={qrUrl} download="vcard-qr.png">
                            <Button className="gap-2 bg-gradient-to-l from-indigo-600 to-blue-700 text-white border-0">
                                <Download className="w-4 h-4" /> {ta('تحميل QR', 'Download QR')}
                            </Button>
                        </a>
                    </div>
                )}
            </div>
        </ToolLayout>
    );
}

// ===== YouTube Thumbnail Tool =====
function YoutubeThumbnailTool({ onBack }: { onBack: () => void }) {
    const [url, setUrl] = useState('');
    const getVideoId = (u: string) => {
        const m = u.match(/(?:v=|youtu\.be\/)([^&\s]+)/);
        return m ? m[1] : null;
    };
    const videoId = getVideoId(url);
    const qualities = videoId ? [
        { label: ta('جودة عالية (HD)', 'High Quality (HD)'), url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` },
        { label: ta('جودة متوسطة', 'Medium Quality'), url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` },
        { label: ta('جودة منخفضة', 'Low Quality'), url: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` },
    ] : [];

    return (
        <ToolLayout title={ta('تحميل مصغرة اليوتيوب', 'Download YouTube Thumbnail')} desc="احصل على الصور المصغرة لمقاطع اليوتيوب بجودات مختلفة" gradient="from-red-600 to-rose-700" icon={Youtube} onBack={onBack}>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{ta('رابط الفيديو', 'Video Link')}</label>
                    <Input placeholder="https://www.youtube.com/watch?v=..." value={url} onChange={e => setUrl(e.target.value)} />
                </div>
                {qualities.map(q => (
                    <div key={q.label} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                        <img src={q.url} alt={q.label} className="w-full h-40 object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                        <div className="flex items-center justify-between p-3">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{q.label}</span>
                            <a href={q.url} download target="_blank" rel="noreferrer">
                                <Button size="sm" className="gap-1.5 bg-gradient-to-l from-red-600 to-rose-700 text-white border-0 text-xs">
                                    <Download className="w-3.5 h-3.5" /> {ta('تحميل', 'Download')}
                                </Button>
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </ToolLayout>
    );
}

// ===== Weighted Average Calculator =====
function WeightedAverageCalc({ onBack }: { onBack: () => void }) {
    const [high, setHigh] = useState('');
    const [qudra, setQudra] = useState('');
    const [tahsili, setTahsili] = useState('');

    const calc = () => {
        const h = parseFloat(high), q = parseFloat(qudra), t = parseFloat(tahsili);
        if (isNaN(h) || isNaN(q) || isNaN(t)) return null;
        return ((h * 0.3) + (q * 0.3) + (t * 0.4)).toFixed(2);
    };
    const result = calc();

    return (
        <ToolLayout title={ta('حاسبة النسبة الموزونة', 'Weighted GPA Calculator')} desc="أداة لحساب النسبة الموزونة للقبول الجامعي بناءً على الثانوية والقدرات والتحصيلي" gradient="from-emerald-600 to-green-700" icon={Calculator} onBack={onBack}>
            <div className="space-y-4">
                {[['high','معدل الثانوية العامة (30%)','المعدل من 100',setHigh,high],['qudra','اختبار القدرات (30%)','النتيجة من 100',setQudra,qudra],['tahsili','الاختبار التحصيلي (40%)','النتيجة من 100',setTahsili,tahsili]].map(([k,l,ph,fn,val]) => (
                    <div key={k as string}>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{l as string}</label>
                        <Input type="number" min="0" max="100" placeholder={ph as string} value={val as string} onChange={e => (fn as any)(e.target.value)} />
                    </div>
                ))}
                {result && (
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-6 text-center">
                        <p className="text-sm text-gray-500 mb-2">{ta('النسبة الموزونة', 'Weighted GPA')}</p>
                        <p className="text-5xl font-black text-emerald-700">{result}%</p>
                        <p className="text-xs text-gray-400 mt-2">{ta('= (الثانوية × 30%) + (القدرات × 30%) + (التحصيلي × 40%)', '= (School × 30%) + (Aptitude × 30%) + (Achievement × 40%)')}</p>
                    </div>
                )}
            </div>
        </ToolLayout>
    );
}

// ===== Image Converter Tool =====
function ImageConverterTool({ onBack }: { onBack: () => void }) {
    const [image, setImage] = useState<string | null>(null);
    const [format, setFormat] = useState('jpeg');
    const [quality, setQuality] = useState(80);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = e => setImage(e.target?.result as string);
        reader.readAsDataURL(file);
    };

    const handleConvert = () => {
        if (!image || !canvasRef.current) return;
        const img = new window.Image();
        img.onload = () => {
            const canvas = canvasRef.current!;
            canvas.width = img.width;
            canvas.height = img.height;
            canvas.getContext('2d')!.drawImage(img, 0, 0);
            const link = document.createElement('a');
            link.download = `converted.${format}`;
            link.href = canvas.toDataURL(`image/${format}`, quality / 100);
            link.click();
            toast.success(ta('تم التحويل والتحميل', 'Converted and downloaded'));
        };
        img.src = image;
    };

    return (
        <ToolLayout title={ta('ضغط وتحويل تنسيق الصور', 'Image Compression & Format Conversion')} desc="أداة مجانية لضغط الصور وتحويلها بين التنسيقات المختلفة (JPG, PNG, WebP)" gradient="from-purple-600 to-violet-700" icon={ImageIcon} onBack={onBack}>
            <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center hover:border-primary/50 transition-colors">
                    {image ? (
                        <div>
                            <img src={image} alt="preview" className="max-h-40 mx-auto rounded-lg mb-3 object-contain" />
                            <button onClick={() => setImage(null)} className="text-xs text-red-500">{ta('حذف الصورة', 'Delete Image')}</button>
                        </div>
                    ) : (
                        <label className="cursor-pointer">
                            <ImageIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">{ta('اضغط لرفع صورة', 'Click to Upload Image')}</p>
                            <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                        </label>
                    )}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{ta('التنسيق المطلوب', 'Desired Format')}</label>
                    <select value={format} onChange={e => setFormat(e.target.value)} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background">
                        <option value="jpeg">JPG</option>
                        <option value="png">PNG</option>
                        <option value="webp">WebP</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">جودة الضغط: {quality}%</label>
                    <input type="range" min="10" max="100" value={quality} onChange={e => setQuality(Number(e.target.value))} className="w-full accent-purple-600" />
                </div>
                <Button onClick={handleConvert} disabled={!image} className="w-full gap-2 bg-gradient-to-l from-purple-600 to-violet-700 text-white border-0 disabled:opacity-50">
                    <Download className="w-4 h-4" /> {ta('تحويل وتحميل', 'Convert and Download')}
                </Button>
                <canvas ref={canvasRef} className="hidden" />
            </div>
        </ToolLayout>
    );
}

// ===== Noor Export Tool =====
function NoorExportTool({ onBack }: { onBack: () => void }) {
    return (
        <ToolLayout title={ta('تصدير تقارير نظام نور', 'Export Noor System Reports')} desc="أداة مجانية لإصلاح مشكلة تصدير التقارير بصيغ PDF، Excel، Word بنظام نور" gradient="from-blue-600 to-indigo-700" icon={FileText} onBack={onBack}>
            <div className="space-y-4 text-center">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6">
                    <FileText className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{ta('خطوات إصلاح تصدير نظام نور', 'Steps to fix Noor system export')}</p>
                    <ol className="text-sm text-gray-600 dark:text-gray-400 text-start space-y-2 list-decimal list-inside">
                        <li>{ta('افتح نظام نور وسجّل دخولك', 'Open Noor system and log in')}</li>
                        <li>{ta('اذهب للتقرير المطلوب تصديره', 'Go to the report you want to export')}</li>
                        <li>{ta('اضغط على زر التصدير (PDF / Excel / Word)', 'Click the Export button (PDF / Excel / Word)')}</li>
                        <li>{ta('إذا لم يعمل، جرّب متصفح Chrome أو Edge', "If it doesn't work, try Chrome or Edge browser")}</li>
                        <li>{ta('تأكد من تفعيل النوافذ المنبثقة في المتصفح', 'Make sure pop-ups are enabled in your browser')}</li>
                        <li>{ta('امسح الكاش والكوكيز ثم أعد المحاولة', 'Clear cache and cookies then retry')}</li>
                    </ol>
                </div>
                <a href="https://noor.moe.gov.sa" target="_blank" rel="noreferrer">
                    <Button className="gap-2 bg-gradient-to-l from-blue-600 to-indigo-700 text-white border-0">
                        <ExternalLink className="w-4 h-4" /> {ta('فتح نظام نور', 'Open Noor System')}
                    </Button>
                </a>
            </div>
        </ToolLayout>
    );
}

// ===== PDF Sign Tool =====
function PDFSignTool({ onBack }: { onBack: () => void }) {
    return (
        <ToolLayout title={ta('توقيعك على ملفات PDF أونلاين', 'Sign PDF Files Online')} desc="أداة مجانية تتيح لك وضع توقيعك الإلكتروني على ملفات PDF أونلاين بسهولة وأمان" gradient="from-slate-600 to-gray-700" icon={FileText} onBack={onBack}>
            <div className="space-y-4 text-center">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
                    <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {ta('يمكنك استخدام أداة التوقيع على PDF مجاناً عبر الموقع الخارجي', 'You can use the PDF signing tool for free via the external website')}
                    </p>
                    <div className="space-y-2">
                        {[
                            { name: 'iLovePDF', url: 'https://www.ilovepdf.com/ar/sign-pdf' },
                            { name: 'Smallpdf', url: 'https://smallpdf.com/ar/sign-pdf' },
                            { name: 'PDF24', url: 'https://tools.pdf24.org/ar/sign-pdf' },
                        ].map(tool => (
                            <a key={tool.name} href={tool.url} target="_blank" rel="noreferrer" className="block">
                                <Button variant="outline" className="w-full gap-2 justify-between">
                                    <span>{tool.name}</span>
                                    <ExternalLink className="w-4 h-4" />
                                </Button>
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </ToolLayout>
    );
}

// ===== Shared Layout =====
function ToolLayout({ title, desc, gradient, icon: Icon, onBack, children }: any) {
  const { dir } = useTranslation();
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir={dir}>
            <Navbar />
            <main className="container mx-auto px-4 pt-28 pb-16 max-w-2xl">
                <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-primary mb-6 text-sm transition-colors">
                    <ChevronRight className="w-4 h-4" /> {ta('العودة للأدوات', 'Back to Tools')}
                </button>
                <Card className="border-0 shadow-lg">
                    <CardHeader className={`bg-gradient-to-l ${gradient} text-white rounded-t-xl`}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><Icon className="w-5 h-5" /></div>
                            <div>
                                <CardTitle className="text-base">{title}</CardTitle>
                                <CardDescription className="text-white/80 text-xs mt-0.5">{desc}</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">{children}</CardContent>
                </Card>
            </main>
            <Footer />
        </div>
    );
}

// ===== Main Page =====
const TOOLS = [
    { id: 'pdf-sign', title: ta('توقيعك على ملفات PDF أونلاين', 'Sign PDF Files Online'), desc: 'أداة مجانية لوضع توقيعك الإلكتروني على ملفات PDF أونلاين بسهولة وأمان', gradient: 'from-slate-600 to-gray-700', icon: FileText },
    { id: 'noor-export', title: ta('تصدير تقارير نظام نور', 'Export Noor System Reports'), desc: 'أداة مجانية لإصلاح مشكلة تصدير التقارير بصيغ PDF، Excel، Word بنظام نور', gradient: 'from-blue-600 to-indigo-700', icon: FileText },
    { id: 'vcard', title: ta('QR Code بطاقة التواصل', 'Contact Card QR Code'), desc: 'أداة لإنشاء رمز QR لبطاقة التواصل الشخصية (vCard) لسهولة المشاركة', gradient: 'from-indigo-600 to-blue-700', icon: QrCode },
    { id: 'qrcode', title: ta('حول أي رابط إلى QR Code', 'Convert any link to a QR Code'), desc: 'أداة مجانية لتحويل أي رابط إلى رمز QR قابل للطباعة والمشاركة', gradient: 'from-gray-600 to-slate-700', icon: QrCode, badge: ta('الأكثر استخداماً', 'Most Used') },
    { id: 'youtube', title: ta('تحميل مصغرة اليوتيوب', 'Download YouTube Thumbnail'), desc: 'احصل على الصور المصغرة لمقاطع اليوتيوب بجودات مختلفة', gradient: 'from-red-600 to-rose-700', icon: Youtube },
    { id: 'calculator', title: ta('حاسبة النسبة الموزونة', 'Weighted GPA Calculator'), desc: 'أداة لحساب النسبة الموزونة للقبول الجامعي بناءً على الثانوية والقدرات والتحصيلي', gradient: 'from-emerald-600 to-green-700', icon: Calculator },
    { id: 'image-converter', title: ta('ضغط وتحويل تنسيق الصور', 'Image Compression & Format Conversion'), desc: 'أداة مجانية لضغط الصور وتحويلها بين التنسيقات المختلفة (JPG, PNG, WebP)', gradient: 'from-purple-600 to-violet-700', icon: ImageIcon },
];

export default function EduToolsPage() {
  const { dir } = useTranslation();
    const [active, setActive] = useState<string | null>(null);

    if (active === 'qrcode') return <QRCodeTool onBack={() => setActive(null)} />;
    if (active === 'vcard') return <VCardTool onBack={() => setActive(null)} />;
    if (active === 'youtube') return <YoutubeThumbnailTool onBack={() => setActive(null)} />;
    if (active === 'calculator') return <WeightedAverageCalc onBack={() => setActive(null)} />;
    if (active === 'image-converter') return <ImageConverterTool onBack={() => setActive(null)} />;
    if (active === 'noor-export') return <NoorExportTool onBack={() => setActive(null)} />;
    if (active === 'pdf-sign') return <PDFSignTool onBack={() => setActive(null)} />;

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950" dir={dir}>
            <Navbar />
            <main>
                <section className="relative overflow-hidden bg-gradient-to-bl from-slate-900 via-gray-900 to-slate-900 text-white">
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-10 right-[15%] w-72 h-72 bg-gray-500/20 rounded-full blur-[120px]" />
                    </div>
                    <div className="relative container mx-auto px-4 pt-32 pb-20 text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 px-5 py-2.5 rounded-full text-sm font-bold mb-6">
                            <Settings className="w-4 h-4 text-gray-400" /> {ta('أدوات', 'Tools')}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black mb-4">{ta('أدوات', 'Tools')}</h1>
                        <p className="text-lg text-white/70 mb-6">{ta('مجموعة من الأدوات المجانية والجاهزة للمعلمين والطلاب وأولياء الأمور', 'A collection of free tools for teachers, students, and parents')}</p>
                    </div>
                </section>

                <div className="container mx-auto px-4 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {TOOLS.map(tool => {
                            const Icon = tool.icon;
                            return (
                                <Card key={tool.id} className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border-0 bg-white dark:bg-gray-800" onClick={() => setActive(tool.id)}>
                                    <div className={`h-2 bg-gradient-to-l ${tool.gradient}`} />
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            {(tool as any).badge && <Badge className="bg-amber-500 text-white text-xs">{(tool as any).badge}</Badge>}
                                        </div>
                                        <CardTitle className="text-sm leading-snug group-hover:text-primary transition-colors">{tool.title}</CardTitle>
                                        <CardDescription className="text-xs mt-1 line-clamp-2">{tool.desc}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <Button className={`w-full bg-gradient-to-l ${tool.gradient} text-white border-0 hover:opacity-90 gap-2 text-xs`}>
                                            <Settings className="w-3.5 h-3.5" /> {ta('ابدأ الاستخدام', 'Start Using')}
                                        </Button>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
