"use client";

import { SessionProvider } from "next-auth/react";
import { Provider as ReduxProvider } from "react-redux";
import { ThemeProvider } from "next-themes";
import { store } from "@/store";

export function RootProvider({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <ReduxProvider store={store}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    {children}
                </ThemeProvider>
            </ReduxProvider>
        </SessionProvider>
    );
}
