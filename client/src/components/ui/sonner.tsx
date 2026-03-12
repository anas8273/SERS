import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      dir="rtl"
      richColors
      closeButton
      visibleToasts={5}
      expand={true}
      gap={8}
      toastOptions={{
        className: "!font-[Tajawal,Cairo,sans-serif] !text-sm !max-w-[90vw] sm:!max-w-md",
        duration: 4000,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
