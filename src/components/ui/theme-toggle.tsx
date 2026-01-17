"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "./button";

export function ThemeToggle() {
    const { setTheme, theme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    // Avoid hydration mismatch
    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <Button variant="ghost" size="sm" className="w-9 px-0">
                <span className="sr-only">Toggle theme</span>
            </Button>
        );
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl w-10 h-10 flex items-center justify-center transition-all duration-300 hover:rotate-12"
        >
            {theme === "light" ? (
                <Moon className="h-5 w-5 text-slate-700" />
            ) : (
                <Sun className="h-5 w-5 text-amber-400" />
            )}
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
}
