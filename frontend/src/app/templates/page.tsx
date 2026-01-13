'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter, Star, Eye, Download, Heart } from 'lucide-react';

interface Template {
  id: number;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  thumbnail: string;
  price: number;
  is_free: boolean;
  is_featured: boolean;
  usage_count: number;
  category: {
    id: number;
    name_ar: string;
    name_en: string;
    slug: string;
  };
  variants_count: number;
}

interface Category {
  id: number;
  name_ar: string;
  name_en: string;
  slug: string;
  children?: Category[];
}

export default function TemplatesPage() {
  const searchParams = useSearchParams();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [priceFilter, setPriceFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('popular');

  useEffect(() => {
    fetchCategories();
    fetchTemplates();
  }, [selectedCategory, priceFilter, sortBy]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const params: any = {
        sort_by: sortBy,
      };
      
      if (selectedCategory !== 'all') {
        params.category_id = selectedCategory;
      }
      
      if (priceFilter === 'free') {
        params.is_free = true;
      } else if (priceFilter === 'paid') {
        params.is_free = false;
      }
      
      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await api.get('/templates', { params });
      setTemplates(response.data.data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTemplates();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4 text-center">القوالب التفاعلية</h1>
          <p className="text-xl text-center opacity-90 mb-8">
            اختر من بين مئات القوالب الجاهزة وقم بتخصيصها حسب احتياجاتك
          </p>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="ابحث عن قالب..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-12 py-6 text-lg bg-white text-gray-900 rounded-full"
              />
              <Button type="submit" className="absolute left-2 top-1/2 transform -translate-y-1/2 rounded-full">
                بحث
              </Button>
            </div>
          </form>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8 items-center justify-between">
          <div className="flex flex-wrap gap-4">
            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="جميع التصنيفات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع التصنيفات</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name_ar}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Price Filter */}
            <Select value={priceFilter} onValueChange={setPriceFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="السعر" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="free">مجاني</SelectItem>
                <SelectItem value="paid">مدفوع</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="ترتيب حسب" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">الأكثر استخداماً</SelectItem>
              <SelectItem value="newest">الأحدث</SelectItem>
              <SelectItem value="price_asc">السعر: من الأقل</SelectItem>
              <SelectItem value="price_desc">السعر: من الأعلى</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Templates Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-xl font-semibold mb-2">لا توجد قوالب</h3>
            <p className="text-gray-500">لم يتم العثور على قوالب تطابق معايير البحث</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {templates.map((template) => (
              <Link href={`/templates/${template.id}`} key={template.id}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <div className="relative h-48 bg-gray-100">
                    {template.thumbnail ? (
                      <Image
                        src={template.thumbnail}
                        alt={template.name_ar}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <span className="text-6xl">📄</span>
                      </div>
                    )}
                    {template.is_featured && (
                      <Badge className="absolute top-2 right-2 bg-yellow-500">
                        <Star className="w-3 h-3 ml-1" />
                        مميز
                      </Badge>
                    )}
                    {template.is_free && (
                      <Badge className="absolute top-2 left-2 bg-green-500">
                        مجاني
                      </Badge>
                    )}
                  </div>
                  
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg line-clamp-1">{template.name_ar}</CardTitle>
                    <Badge variant="outline" className="w-fit">
                      {template.category?.name_ar}
                    </Badge>
                  </CardHeader>
                  
                  <CardContent className="pb-2">
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {template.description_ar}
                    </p>
                  </CardContent>
                  
                  <CardFooter className="flex justify-between items-center pt-2 border-t">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {template.usage_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Download className="w-4 h-4" />
                        {template.variants_count} شكل
                      </span>
                    </div>
                    <div className="font-bold text-primary">
                      {template.is_free ? 'مجاني' : `${template.price} ر.س`}
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
