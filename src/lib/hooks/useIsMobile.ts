import { useState, useEffect } from "react";

/**
 * Hook to detect if the current viewport is below a certain mobile breakpoint.
 * Defaults to the Tailwind 'lg' breakpoint (1024px) to align with standard desktop layouts.
 */
export function useIsMobile(breakpoint = 768) {
    const [isMobile, setIsMobile] = useState<boolean>(false);

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        const checkIsMobile = () => {
            setIsMobile(window.innerWidth < breakpoint);
        };

        // Set initial value immediately
        checkIsMobile();

        // Listen for resize events with strict debounce
        const handleResize = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(checkIsMobile, 150);
        };

        window.addEventListener("resize", handleResize);

        // Cleanup
        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener("resize", handleResize);
        };
    }, [breakpoint]);

    return isMobile;
}
