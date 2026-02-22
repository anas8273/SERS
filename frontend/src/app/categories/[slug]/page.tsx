'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  FileText,
  Loader2,
  ChevronLeft,
  Star,
  Eye,
  Search,
  Grid3X3,
  List,
  Sparkles,
  ArrowUpDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { ServiceCategory, ServiceDefinition } from '@/types';
import {
  getServiceCategories,
  getAllServices,
} from '@/lib/firestore-service';

export default function CategoryTemplatesPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [category, setCategory] = useState<ServiceCategory | null>(null);
  const [services, setServices] = useState<ServiceDefinition[]>([]);
  const [allCategories, setAllCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'newest' | 'popular'>('name');

  useEffect(() => {
    if (slug) {
      loadData();
    }
  }, [slug]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load categories and services from Firestore
      const [cats, allSvcs] = await Promise.all([
        getServiceCategories(),
        getAllServices(),
      ]);

      setAllCategories(cats.filter(c => c.is_active !== false));

      // Find category by slug or id
      const foundCat = cats.find(
        c => c.slug === slug || c.id === slug || c.name_en?.toLowerCase().replace(/\s+/g, '-') === slug
      );

      if (foundCat) {
        setCategory(foundCat);
        // Filter services belonging to this category
        const catServices = allSvcs.filter(
          s => s.category === foundCat.id || s.category === foundCat.slug || s.category === foundCat.name_ar
        );
        setServices(catServices.filter(s => s.is_active !== false));
      } else {
        setError('التصنيف غير موجود');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort
  const filteredServices = services
    .filter(s =>
      s.name_ar.includes(searchQuery) ||
      s.name_en?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description_ar?.includes(searchQuery)
    )
    .sort((a, b) => {
      if (sortBy === 'name') return a.name_ar.localeCompare(b.name_ar, 'ar');
      if (sortBy === 'newest') return (b.sort_order || 0) - (a.sort_order || 0);
      return (b.sort_order || 0) - (a.sort_order || 0);
    });

  // Icon mapping
  const getIconEmoji = (icon: string) => {
    const map: Record<string, string> = {
      'BarChart3': '📊', 'Award': '🏆', 'ClipboardList': '📋', 'Trophy': '🏅',
      'FileText': '📄', 'Bot': '🤖', 'Target': '🎯', 'Sparkles': '✨',
      'Calendar': '📅', 'GraduationCap': '🎓', 'Users': '👥', 'BookOpen': '📖',
      'FolderArchive': '🗂️', 'ClipboardCheck': '✅', 'ScrollText': '📜',
      'Lightbulb': '💡', 'Heart': '❤️', 'Star': '⭐', 'FolderOpen': '📁',
      'Briefcase': '💼', 'Palette': '🎨', 'Shield': '🛡️',
    };
    return map[icon] || '📄';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-500">جاري تحميل التصنيف...</p>
        </div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">📂</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {error || 'التصنيف غير موجود'}
          </h2>
          <p className="text-gray-500 mb-6">
            قد يكون التصنيف غير موجود أو تم حذفه. يمكنك استعراض جميع الخدمات المتاحة.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/services">
              <Button className="bg-primary hover:bg-primary/90">
                استعراض الخدمات
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline">
                الصفحة الرئيسية
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
      {/* Breadcrumb */}
      <div className="bg-white dark:bg-gray-800 border-b">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center gap-2 text-sm flex-wrap">
            <Link href="/" className="text-gray-500 hover:text-primary">الرئيسية</Link>
            <ChevronLeft className="w-4 h-4 text-gray-400" />
            <Link href="/services" className="text-gray-500 hover:text-primary">الخدمات</Link>
            <ChevronLeft className="w-4 h-4 text-gray-400" />
            <span className="text-primary font-medium">{category.name_ar}</span>
          </nav>
        </div>
      </div>

      {/* Category Header */}
      <div className="bg-gradient-to-l from-primary/10 via-primary/5 to-transparent dark:from-primary/20 dark:via-primary/10">
        <div className="container mx-auto px-4 py-8 sm:py-12">
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg"
              style={{ backgroundColor: category.color?.startsWith('#') ? category.color : undefined }}
              // Use Tailwind class if not hex
            >
              {getIconEmoji(category.icon)}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                {category.name_ar}
              </h1>
              {category.name_en && (
                <p className="text-sm text-gray-500" dir="ltr">{category.name_en}</p>
              )}
            </div>
          </div>
          {category.description_ar && (
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
              {category.description_ar}
            </p>
          )}
          <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              {filteredServices.length} خدمة/قالب
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="بحث في هذا التصنيف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 border rounded-lg text-sm bg-white dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="name">الاسم</option>
              <option value="newest">الأحدث</option>
              <option value="popular">الأكثر شعبية</option>
            </select>
          </div>
        </div>

        {/* Services Grid/List */}
        {filteredServices.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              {searchQuery ? 'لا توجد نتائج' : 'لا توجد خدمات في هذا التصنيف بعد'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchQuery
                ? 'جرب البحث بكلمات مختلفة'
                : 'سيتم إضافة خدمات جديدة قريباً في هذا التصنيف'}
            </p>
            <Link href="/services">
              <Button variant="outline">استعراض جميع الخدمات</Button>
            </Link>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => router.push(`/services/${service.slug}`)}
              >
                {/* Gradient Header */}
                <div className={`h-32 bg-gradient-to-l ${service.gradient || 'from-primary to-primary/80'} flex items-center justify-center relative`}>
                  <span className="text-5xl opacity-80 group-hover:scale-110 transition-transform">
                    {getIconEmoji(service.icon)}
                  </span>
                  {service.is_popular && (
                    <Badge className="absolute top-3 left-3 bg-yellow-500 text-white">
                      <Star className="w-3 h-3 ml-1" /> مميز
                    </Badge>
                  )}
                </div>
                {/* Content */}
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1 group-hover:text-primary transition-colors">
                    {service.name_ar}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                    {service.description_ar}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {service.features?.slice(0, 2).map((f, i) => (
                        <Badge key={i} variant="outline" className="text-[10px]">
                          {f.title_ar}
                        </Badge>
                      ))}
                    </div>
                    <Button size="sm" variant="ghost" className="text-primary">
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all cursor-pointer flex items-center gap-4"
                onClick={() => router.push(`/services/${service.slug}`)}
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-l ${service.gradient || 'from-primary to-primary/80'} flex items-center justify-center flex-shrink-0`}>
                  <span className="text-2xl">{getIconEmoji(service.icon)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 dark:text-white truncate">
                    {service.name_ar}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-1">{service.description_ar}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {service.is_popular && (
                    <Badge className="bg-yellow-100 text-yellow-700">مميز</Badge>
                  )}
                  <Button size="sm" variant="outline">
                    عرض <ArrowRight className="w-3 h-3 mr-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Other Categories */}
      {allCategories.length > 1 && (
        <div className="bg-white dark:bg-gray-800 border-t mt-8">
          <div className="container mx-auto px-4 py-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              تصنيفات أخرى
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {allCategories
                .filter(c => c.id !== category.id)
                .map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/categories/${cat.slug || cat.id}`}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary hover:shadow-md transition-all text-center"
                  >
                    <span className="text-2xl">{getIconEmoji(cat.icon)}</span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 line-clamp-1">
                      {cat.name_ar}
                    </span>
                  </Link>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
