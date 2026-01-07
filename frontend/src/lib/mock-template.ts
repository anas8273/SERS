export const MOCK_TEMPLATE_DATA = {
    personalInfo: {
        fullName: "John Doe",
        jobTitle: "Senior Software Engineer",
        email: "john.doe@example.com",
        phone: "+1 234 567 890",
        location: "San Francisco, CA",
        website: "www.johndoe.dev",
        bio: "Passionate software engineer with over 5 years of experience in building scalable web applications. Expert in React, Node.js, and Cloud Architecture. Committed to writing clean, maintainable code and solving complex problems.",
    },
    styles: {
        primaryColor: "#2563eb", // blue-600
        fontFamily: "Inter"
    }
}

export type TemplateData = typeof MOCK_TEMPLATE_DATA
