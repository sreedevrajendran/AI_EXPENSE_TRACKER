/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: "class",
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                "ios-blue": "#007AFF",
                "ios-blue-dark": "#0A84FF",
                "ios-green": "#34C759",
                "ios-yellow": "#FF9F0A",
                "ios-red": "#FF3B30",
                "ios-orange": "#FF6B00",
                "ios-teal": "#5AC8FA",
                "ios-indigo": "#5856D6",
                "ios-bg": {
                    light: "#FFFFFF",
                    dark: "#000000",
                },
                "ios-surface": {
                    light: "#F2F2F7",
                    dark: "#1C1C1E",
                },
                "ios-surface2": {
                    light: "#FFFFFF",
                    dark: "#2C2C2E",
                },
                "ios-surface3": {
                    light: "#F2F2F7",
                    dark: "#3A3A3C",
                },
                "ios-text": {
                    primary: {
                        light: "#000000",
                        dark: "#FFFFFF",
                    },
                    secondary: {
                        light: "#6C6C70",
                        dark: "#8E8E93",
                    },
                },
                "ios-separator": {
                    light: "rgba(60,60,67,0.12)",
                    dark: "rgba(84,84,88,0.36)",
                },
            },
            borderRadius: {
                ios: "18px",
                "ios-sm": "10px",
                "ios-lg": "28px",
                "ios-xl": "36px",
            },
            fontFamily: {
                sans: [
                    "-apple-system",
                    "BlinkMacSystemFont",
                    "SF Pro Display",
                    "SF Pro Text",
                    "Helvetica Neue",
                    "Arial",
                    "sans-serif",
                ],
            },
            backdropBlur: {
                xs: "4px",
                ios: "20px",
            },
            boxShadow: {
                ios: "0 2px 8px rgba(0,0,0,0.08), 0 0 1px rgba(0,0,0,0.06)",
                "ios-lg": "0 8px 32px rgba(0,0,0,0.12), 0 0 1px rgba(0,0,0,0.08)",
            },
            spacing: {
                "safe-bottom": "env(safe-area-inset-bottom)",
                "safe-top": "env(safe-area-inset-top)",
            },
            keyframes: {
                "slide-up": {
                    "0%": { transform: "translateY(100%)", opacity: "0" },
                    "100%": { transform: "translateY(0)", opacity: "1" },
                },
                "fade-in": {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                "scale-in": {
                    "0%": { transform: "scale(0.95)", opacity: "0" },
                    "100%": { transform: "scale(1)", opacity: "1" },
                },
                shimmer: {
                    "0%": { backgroundPosition: "-200% 0" },
                    "100%": { backgroundPosition: "200% 0" },
                },
            },
            animation: {
                "slide-up": "slide-up 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
                "fade-in": "fade-in 0.2s ease-out",
                "scale-in": "scale-in 0.2s cubic-bezier(0.32, 0.72, 0, 1)",
                shimmer: "shimmer 1.5s infinite",
            },
        },
    },
    plugins: [],
};
