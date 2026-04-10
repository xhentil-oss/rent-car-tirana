module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', "sans-serif"],
        mono: ['"IBM Plex Mono"', "monospace"],
      },
      colors: {
        primary: {
          DEFAULT: "hsl(215, 90%, 32%)",
          foreground: "hsl(0, 0%, 100%)",
          hover: "hsl(215, 90%, 25%)",
          active: "hsl(215, 90%, 20%)",
        },
        secondary: {
          DEFAULT: "hsl(215, 85%, 92%)",
          foreground: "hsl(215, 85%, 22%)",
          hover: "hsl(215, 85%, 87%)",
          active: "hsl(215, 85%, 80%)",
        },
        tertiary: {
          DEFAULT: "hsl(0, 0%, 100%)",
          foreground: "hsl(215, 20%, 20%)",
        },
        accent: {
          DEFAULT: "hsl(45, 100%, 55%)",
          foreground: "hsl(215, 95%, 10%)",
        },
        background: "hsl(0, 0%, 98%)",
        foreground: "hsl(215, 15%, 15%)",
        border: "hsl(215, 10%, 80%)",
        input: "hsl(215, 10%, 80%)",
        ring: "hsl(215, 90%, 35%)",
        card: {
          DEFAULT: "hsl(0, 0%, 100%)",
          foreground: "hsl(215, 15%, 15%)",
        },
        muted: {
          DEFAULT: "hsl(215, 10%, 94%)",
          foreground: "hsl(215, 10%, 50%)",
        },
        destructive: {
          DEFAULT: "hsl(0, 70%, 45%)",
          foreground: "hsl(0, 0%, 100%)",
        },
        success: {
          DEFAULT: "hsl(142, 60%, 42%)",
          foreground: "hsl(0, 0%, 100%)",
        },
        warning: {
          DEFAULT: "hsl(45, 100%, 51%)",
          foreground: "hsl(215, 90%, 15%)",
        },
        error: {
          DEFAULT: "hsl(0, 70%, 45%)",
          foreground: "hsl(0, 0%, 100%)",
        },
        info: {
          DEFAULT: "hsl(215, 90%, 42%)",
          foreground: "hsl(0, 0%, 100%)",
        },
        neutral: {
          50: "hsl(0, 0%, 98%)",
          100: "hsl(0, 0%, 94%)",
          200: "hsl(215, 10%, 87%)",
          300: "hsl(215, 10%, 75%)",
          400: "hsl(215, 10%, 62%)",
          500: "hsl(215, 10%, 50%)",
          600: "hsl(215, 10%, 40%)",
          700: "hsl(215, 15%, 30%)",
          800: "hsl(215, 20%, 20%)",
          900: "hsl(215, 20%, 12%)",
        },
        "admin-sidebar": "hsl(215, 30%, 12%)",
        "admin-sidebar-foreground": "hsl(0, 0%, 100%)",
        "admin-sidebar-active": "hsl(215, 90%, 32%)",
        "admin-sidebar-hover": "hsl(215, 25%, 18%)",
      },
      backgroundImage: {
        "gradient-primary":
          "linear-gradient(135deg, hsl(215, 90%, 35%) 0%, hsl(230, 90%, 50%) 100%)",
        "gradient-secondary":
          "linear-gradient(135deg, hsl(215, 85%, 95%) 0%, hsl(215, 80%, 88%) 100%)",
        "gradient-accent":
          "linear-gradient(90deg, hsl(43, 100%, 55%) 0%, hsl(35, 100%, 52%) 100%)",
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        "2xl": "24px",
        full: "9999px",
        DEFAULT: "12px",
      },
      boxShadow: {
        sm: "0 1px 2px hsl(215 20% 20% / 0.05)",
        md: "0 2px 8px hsl(215 20% 20% / 0.08)",
        lg: "0 4px 16px hsl(215 20% 20% / 0.12)",
        xl: "0 8px 32px hsl(215 20% 20% / 0.15)",
        "card-hover": "0 6px 12px hsl(215 20% 20% / 0.1)",
        "btn-primary": "0 4px 10px hsl(215 70% 40% / 0.3)",
      },
      transitionTimingFunction: {
        "ease-in": "cubic-bezier(0.4, 0, 1, 1)",
        "ease-out": "cubic-bezier(0, 0, 0.2, 1)",
        "ease-in-out": "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      transitionDuration: {
        fast: "150ms",
        normal: "250ms",
        slow: "400ms",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out forwards",
        "slide-in": "slideIn 0.3s ease-out forwards",
        "count-up": "countUp 1s ease-out forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-12px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};
