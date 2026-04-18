import { cn } from "@/lib/utils";

// Use system font stack — works offline without Google Fonts dependency
const fontClass = "font-sans";

interface HeaderProps {
    label: string;
}

export const Header = ({
    label,
}: HeaderProps) => {
    return (
        <div className="w-full flex flex-col gap-y-4 items-center justify-center">
            <h1 className={cn(
                "text-3xl font-semibold drop-shadow-sm",
                fontClass,
            )}>
                🔐 SERS
            </h1>
            <p className="text-muted-foreground text-sm">
                {label}
            </p>
        </div>
    );
};
