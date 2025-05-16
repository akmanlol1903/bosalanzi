import { fontFamily } from "tailwindcss/defaultTheme";
import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx,html,svelte}"], // Merged content paths
  safelist: ["dark"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px"
      }
    },
    extend: {
      boxShadow: {
        'custom-inset': 'inset 0 1px 1px var(--box-shadow) !important'
      },
      colors: {
        border: "hsl(var(--border) / <alpha-value>)", // Prioritized from second config
        input: "hsl(var(--input) / <alpha-value>)",   // Prioritized from second config
        ring: "hsl(var(--ring) / <alpha-value>)",     // Prioritized from second config
        background: "hsl(var(--background) / <alpha-value>)", // Prioritized from second config
        foreground: "hsl(var(--foreground) / <alpha-value>)", // Prioritized from second config
        success: "hsl(var(--success) / <alpha-value>)",       // Prioritized from second config
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",       // Prioritized from second config
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)" // Prioritized from second config
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",       // Prioritized from second config
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)" // Prioritized from second config
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",       // Prioritized from second config
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)" // Prioritized from second config
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",       // Prioritized from second config
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)" // Prioritized from second config
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",       // Prioritized from second config
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)" // Prioritized from second config
        },
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",       // Prioritized from second config
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)" // Prioritized from second config
        },
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)", // Prioritized from second config
          foreground: "hsl(var(--card-foreground) / <alpha-value>)", // Prioritized from second config
          hover: "hsl(var(--card-hover))", // Included from first config
        },
        sidebar: { // Included from second config
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: { // Included from second config
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)"
      },
      fontFamily: { // Included from second config
        sans: ["Inter", ...fontFamily.sans],
      },
      letterSpacing: { // Included from second config
        "tight-8": "-8%",
      },
      keyframes: {
        cum: { // Included from first config
          '0%': { opacity: '0' },
          '50%': { opacity: '0.8' },
          '100%': { opacity: '0' }
        },
        "accordion-down": { // Included from second config
          from: { height: "0" },
          to: { height: "var(--bits-accordion-content-height)" },
        },
        "accordion-up": { // Included from second config
          from: { height: "var(--bits-accordion-content-height)" },
          to: { height: "0" },
        },
        "caret-blink": { // Included from second config
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
      },
      animation: {
        'cum': 'cum 3s ease-in-out', // Included from first config
        "accordion-down": "accordion-down 0.2s ease-out", // Included from second config
        "accordion-up": "accordion-up 0.2s ease-out", // Included from second config
        "caret-blink": "caret-blink 1.25s ease-out infinite", // Included from second config
      }
    },
  },
  plugins: [tailwindcssAnimate], // Included from second config
};

export default config;