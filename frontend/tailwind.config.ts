import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        /** Paleta corporativa BMW. */
        brand: {
          blue: '#1d6fd8',
          'blue-electric': '#3b8bff',
          'blue-ice': '#e8f1ff',
          'blue-dark': '#0a4c93',
          'blue-deep': '#0b3b73',
          'blue-night': '#071a33',
          'blue-ink': '#040d1c',
          silver: '#e6e7e8',
        },
        /** Colores del emblema M. */
        m: {
          blue: '#0066b1',
          darkblue: '#16588e',
          red: '#e31e24',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        '2xl': 'calc(var(--radius) + 0.5rem)',
      },
      boxShadow: {
        panel: '0 18px 50px -20px rgba(6, 30, 60, 0.35)',
        card: '0 1px 2px rgba(16, 24, 40, 0.04), 0 20px 45px -28px rgba(16, 24, 40, 0.28)',
        glow: '0 0 0 1px rgba(59, 139, 255, 0.22), 0 26px 60px -28px rgba(11, 84, 168, 0.7)',
        'inset-hairline': 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
      },
      backgroundImage: {
        'bmw-mesh':
          'radial-gradient(1100px 560px at 0% -10%, rgba(29,111,216,0.14), transparent 60%), radial-gradient(900px 480px at 100% 0%, rgba(227,30,36,0.07), transparent 55%), radial-gradient(760px 720px at 55% 118%, rgba(22,88,142,0.14), transparent 60%)',
        'sidebar-grid':
          'linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)',
        'm-gradient': 'linear-gradient(135deg, #0066b1 0%, #16588e 46%, #e31e24 100%)',
      },
      backgroundSize: {
        grid: '26px 26px',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'panel-in': {
          from: { opacity: '0', transform: 'translateY(10px) scale(0.99)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.45s ease-out both',
        'slide-up': 'slide-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        float: 'float 6s ease-in-out infinite',
        'panel-in': 'panel-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [animate],
};

export default config;
