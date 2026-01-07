'use client'

import { TemplateData } from '@/lib/mock-template'
import { Label } from '@/components/ui/label'

interface EditorSidebarProps {
    data: TemplateData
    onChange: (newData: TemplateData) => void
}

export function EditorSidebar({ data, onChange }: EditorSidebarProps) {

    const handleChange = (section: keyof TemplateData, field: string, value: string) => {
        onChange({
            ...data,
            [section]: {
                ...data[section],
                [field]: value
            }
        })
    }

    return (
        <div className="w-full h-full overflow-y-auto p-6 space-y-8 bg-white/40 dark:bg-black/40 backdrop-blur-xl border-r border-white/20 dark:border-zinc-800">

            {/* Design Section */}
            <div className="space-y-4">
                <h3 className="font-semibold text-lg text-primary">Design</h3>
                <div className="space-y-2">
                    <Label htmlFor="color">Accent Color</Label>
                    <div className="flex items-center gap-3">
                        <input
                            type="color"
                            id="color"
                            value={data.styles.primaryColor}
                            onChange={(e) => handleChange('styles', 'primaryColor', e.target.value)}
                            className="h-10 w-20 p-1 rounded cursor-pointer bg-white border border-gray-200"
                        />
                        <span className="text-sm text-muted-foreground">{data.styles.primaryColor}</span>
                    </div>
                </div>
            </div>

            {/* Personal Info Section */}
            <div className="space-y-4">
                <h3 className="font-semibold text-lg text-primary">Personal Details</h3>

                <div className="space-y-3">
                    <div className="space-y-1">
                        <Label htmlFor="fullName">Full Name</Label>
                        <input
                            type="text"
                            id="fullName"
                            value={data.personalInfo.fullName}
                            onChange={(e) => handleChange('personalInfo', 'fullName', e.target.value)}
                            className="w-full px-3 py-2 bg-background/50 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="jobTitle">Job Title</Label>
                        <input
                            type="text"
                            id="jobTitle"
                            value={data.personalInfo.jobTitle}
                            onChange={(e) => handleChange('personalInfo', 'jobTitle', e.target.value)}
                            className="w-full px-3 py-2 bg-background/50 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="bio">Professional Summary</Label>
                        <textarea
                            id="bio"
                            rows={4}
                            value={data.personalInfo.bio}
                            onChange={(e) => handleChange('personalInfo', 'bio', e.target.value)}
                            className="w-full px-3 py-2 bg-background/50 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label htmlFor="email">Email</Label>
                            <input
                                type="email"
                                id="email"
                                value={data.personalInfo.email}
                                onChange={(e) => handleChange('personalInfo', 'email', e.target.value)}
                                className="w-full px-3 py-2 bg-background/50 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="phone">Phone</Label>
                            <input
                                type="text"
                                id="phone"
                                value={data.personalInfo.phone}
                                onChange={(e) => handleChange('personalInfo', 'phone', e.target.value)}
                                className="w-full px-3 py-2 bg-background/50 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="location">Location</Label>
                        <input
                            type="text"
                            id="location"
                            value={data.personalInfo.location}
                            onChange={(e) => handleChange('personalInfo', 'location', e.target.value)}
                            className="w-full px-3 py-2 bg-background/50 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
