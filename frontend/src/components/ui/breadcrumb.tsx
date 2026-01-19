'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
  homeLabel?: string;
}

export function Breadcrumb({
  items,
  className,
  showHome = true,
  homeLabel = 'الرئيسية',
}: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        'flex items-center space-x-2 space-x-reverse text-sm text-gray-500 dark:text-gray-400',
        className
      )}
    >
      {showHome && (
        <>
          <Link
            href="/"
            className="flex items-center hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <Home className="h-4 w-4 ml-1" />
            <span>{homeLabel}</span>
          </Link>
          {items.length > 0 && (
            <ChevronLeft className="h-4 w-4 text-gray-400" />
          )}
        </>
      )}
      
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900 dark:text-white font-medium">
              {item.label}
            </span>
          )}
          
          {index < items.length - 1 && (
            <ChevronLeft className="h-4 w-4 text-gray-400" />
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

// مكون Breadcrumb بسيط للصفحات
export function PageBreadcrumb({
  pageName,
  parentName,
  parentHref,
}: {
  pageName: string;
  parentName?: string;
  parentHref?: string;
}) {
  const items: BreadcrumbItem[] = [];
  
  if (parentName && parentHref) {
    items.push({ label: parentName, href: parentHref });
  }
  
  items.push({ label: pageName });
  
  return <Breadcrumb items={items} className="mb-6" />;
}
