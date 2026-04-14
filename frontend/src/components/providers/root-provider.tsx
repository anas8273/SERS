"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";

export function RootProvider({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            {children}
            <Toaster position="top-center" />
        </ThemeProvider>
    );
}
