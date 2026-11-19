import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      colors: {
        // Direct Apple Enterprise Design Palette
        app: {
          bg: "var(--bg-app)",
          border: "var(--border-subtle)",
          borderStrong: "var(--border-strong)",
        },
        surface: {
          primary: "var(--surface-primary)",
          secondary: "var(--surface-secondary)",
          subtle: "var(--surface-subtle)",
          sidebar: "var(--surface-sidebar)",
          header: "var(--surface-header)",
        },
        content: {
          primary: "var(--text-primary)",
          body: "var(--text-body)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
          disabled: "var(--text-disabled)",
        },
        brand: {
          blue: "var(--brand-blue)",
          hover: "var(--brand-hover)",
          pale: "var(--brand-pale)",
        },
        status: {
          approved: { bg: "var(--status-approved-bg)", text: "var(--status-approved-text)" },
          pending: { bg: "var(--status-pending-bg)", text: "var(--status-pending-text)" },
          rejected: { bg: "var(--status-rejected-bg)", text: "var(--status-rejected-text)" },
          clarification: { bg: "var(--status-clarification-bg)", text: "var(--status-clarification-text)" },
          info: { bg: "var(--status-info-bg)", text: "var(--status-info-text)" },
          neutral: { bg: "var(--status-neutral-bg)", text: "var(--status-neutral-text)" },
        },

        // Tailwind standard mapping
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
      },
      borderRadius: {
        "2xl": "1rem",      /* 16px - Dialogs, large containers */
        xl: "0.875rem",     /* 14px - Cards */
        lg: "0.625rem",     /* 10px - Inputs, buttons */
        md: "0.5rem",       /* 8px */
        sm: "0.375rem",     /* 6px */
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)",
        dropdown: "0 10px 25px -5px rgba(0, 0, 0, 0.07), 0 8px 10px -6px rgba(0, 0, 0, 0.03)",
        modal: "0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.02)",
      },
      transitionDuration: {
        fast: "120ms",
        base: "150ms",
        smooth: "180ms",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "fade-in": { from: { opacity: "0", transform: "translateY(2px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "slide-in": { from: { transform: "translateX(-100%)" }, to: { transform: "translateX(0)" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
        "accordion-up": "accordion-up 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-in": "fade-in 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-in": "slide-in 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [animate],
};
export default config;
