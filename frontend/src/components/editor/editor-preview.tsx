'use client'

import { TemplateData } from '@/lib/mock-template'
import { Mail, MapPin, Phone, Globe } from 'lucide-react'

interface EditorPreviewProps {
    data: TemplateData
}

export function EditorPreview({ data }: EditorPreviewProps) {
    const { personalInfo, styles } = data

    return (
        <div className="w-full h-full overflow-y-auto bg-gray-100/50 dark:bg-black/50 p-8 flex justify-center items-start">
            {/* A4 Paper Container */}
            {/* A4 Aspect Ratio is roughly 1 : 1.414 */}
            {/* We use a fixed width or max-width that mimics paper size on screen */}
            <div
                className="bg-white text-black shadow-2xl w-full max-w-[210mm] min-h-[297mm] mx-auto p-0 overflow-hidden relative"
                style={{
                    fontFamily: styles.fontFamily || 'Inter, sans-serif'
                }}
            >
                {/* Header Section */}
                <div
                    className="p-10 text-white space-y-4"
                    style={{ backgroundColor: styles.primaryColor }}
                >
                    <h1 className="text-4xl font-bold tracking-tight">{personalInfo.fullName}</h1>
                    <p className="text-xl opacity-90 font-medium">{personalInfo.jobTitle}</p>
                </div>

                {/* Content Body */}
                <div className="p-10 grid grid-cols-12 gap-8">

                    {/* Left Column (Main) */}
                    <div className="col-span-8 space-y-8">
                        {/* Profile */}
                        <section className="space-y-3">
                            <h3
                                className="text-xl font-bold uppercase tracking-wide border-b-2 pb-1"
                                style={{ borderColor: styles.primaryColor, color: styles.primaryColor }}
                            >
                                Profile
                            </h3>
                            <p className="text-gray-700 leading-relaxed text-sm">
                                {personalInfo.bio}
                            </p>
                        </section>

                        {/* Experience Placeholder */}
                        <section className="space-y-3">
                            <h3
                                className="text-xl font-bold uppercase tracking-wide border-b-2 pb-1"
                                style={{ borderColor: styles.primaryColor, color: styles.primaryColor }}
                            >
                                Experience
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between items-baseline">
                                        <h4 className="font-bold text-gray-800">Senior Developer</h4>
                                        <span className="text-sm text-gray-500">2021 - Present</span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-600">Tech Corp Inc.</p>
                                    <ul className="list-disc list-inside text-sm text-gray-700 mt-2 space-y-1">
                                        <li>Led a team of 5 developers to build core features.</li>
                                        <li>Improved system performance by 30%.</li>
                                    </ul>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Column (Sidebar) */}
                    <div className="col-span-4 space-y-8">
                        {/* Contact Info */}
                        <section className="space-y-4">
                            <h3
                                className="text-sm font-bold uppercase tracking-wide border-b-2 pb-1"
                                style={{ borderColor: styles.primaryColor, color: styles.primaryColor }}
                            >
                                Contact
                            </h3>
                            <div className="space-y-3 text-sm text-gray-700">
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    <span className="break-all">{personalInfo.email}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4" />
                                    <span>{personalInfo.phone}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    <span>{personalInfo.location}</span>
                                </div>
                                {personalInfo.website && (
                                    <div className="flex items-center gap-2">
                                        <Globe className="w-4 h-4" />
                                        <span>{personalInfo.website}</span>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Skills Placeholder */}
                        <section className="space-y-4">
                            <h3
                                className="text-sm font-bold uppercase tracking-wide border-b-2 pb-1"
                                style={{ borderColor: styles.primaryColor, color: styles.primaryColor }}
                            >
                                Skills
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {['React', 'Next.js', 'Typescript', 'Node.js', 'Tailwind', 'Git'].map(skill => (
                                    <span key={skill} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded font-medium">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </section>
                    </div>

                </div>
            </div>
        </div>
    )
}
