'use client'

import { Button } from '@/components/ui/button'
import { Save, Download, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

export function Toolbar() {
    const [isDownloading, setIsDownloading] = useState(false)

    const handleDownload = () => {
        setIsDownloading(true)
        toast.loading('Generating PDF...', { id: 'pdf-gen' })

        setTimeout(() => {
            setIsDownloading(false)
            toast.dismiss('pdf-gen')
            toast.success('PDF Downloaded Successfully', {
                description: 'Your resume is ready to use.',
            })
        }, 2000)
    }

    return (
        <div className="h-16 border-b border-white/20 bg-white/40 dark:bg-black/40 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-50">
            <div className="flex items-center gap-4">
                <Link href="/dashboard">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div className="flex flex-col">
                    <span className="font-semibold text-sm">Untitled Resume</span>
                    <span className="text-xs text-muted-foreground">Last saved just now</span>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="hidden sm:flex" onClick={() => toast.success('Saved')}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Draft
                </Button>
                <Button size="sm" onClick={handleDownload} disabled={isDownloading}>
                    {isDownloading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Download className="w-4 h-4 mr-2" />
                            Download PDF
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}
