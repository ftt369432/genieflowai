const colors = require('tailwindcss/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Theme colors using CSS variables
        background: 'var(--color-background)',
        paper: 'var(--color-paper)',
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        info: 'var(--color-info)',
        border: 'var(--color-border)',
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
        },
        cyberpunk: {
          dark: '#0a0a0f',
          darker: '#050507',
          neon: '#0ff',
          pink: '#ff00ff',
          yellow: '#ffff00',
        },
      },
      animation: {
        glow: 'glow 1.5s ease-in-out infinite alternate',
        scanline: 'scanline 8s linear infinite',
        pulse: 'pulse-neon 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        float: 'float 3s ease-in-out infinite',
        textShimmer: 'text-shimmer 2s ease-in-out infinite alternate',
        scan: 'scan 4s linear infinite',
        'glitch-1': 'glitch-1 4s linear infinite',
        'glitch-2': 'glitch-2 4s linear infinite',
        'matrix': 'matrix 20s linear infinite',
        'flicker': 'flicker 0.5s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { textShadow: '0 0 5px var(--color-primary), 0 0 10px var(--color-primary), 0 0 15px var(--color-primary)' },
          '100%': { textShadow: '0 0 10px var(--color-primary), 0 0 20px var(--color-primary), 0 0 30px var(--color-primary)' },
        },
        scanline: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(100%)' },
        },
        scan: {
          '0%': { backgroundPosition: '0 -100vh' },
          '100%': { backgroundPosition: '0 100vh' }
        },
        'glitch-1': {
          '0%, 100%': { transform: 'none' },
          '41.99%': { transform: 'none' },
          '42%': { transform: 'translate(2px, 1px)' },
          '43%': { transform: 'none' },
          '45%': { transform: 'none' },
          '45.01%': { transform: 'translate(-2px, -1px)' },
          '45.02%': { transform: 'none' },
          '46%': { transform: 'none' },
          '46.01%': { transform: 'translate(3px, 2px)' },
          '46.99%': { transform: 'translate(3px, 2px)' },
          '47%': { transform: 'none' },
          '49%': { transform: 'none' },
          '49.01%': { transform: 'translate(2px, -1px)' },
          '49.99%': { transform: 'translate(2px, -1px)' },
          '50%': { transform: 'none' }
        },
        'glitch-2': {
          '0%, 100%': { transform: 'none' },
          '41.99%': { transform: 'none' },
          '42%': { transform: 'translate(-2px, -1px)' },
          '43%': { transform: 'none' },
          '45%': { transform: 'none' },
          '45.01%': { transform: 'translate(2px, 1px)' },
          '45.02%': { transform: 'none' },
          '46%': { transform: 'none' },
          '46.01%': { transform: 'translate(-3px, -2px)' },
          '46.99%': { transform: 'translate(-3px, -2px)' },
          '47%': { transform: 'none' },
          '49%': { transform: 'none' },
          '49.01%': { transform: 'translate(-2px, 1px)' },
          '49.99%': { transform: 'translate(-2px, 1px)' },
          '50%': { transform: 'none' }
        },
        matrix: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' }
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' }
        },
        pulse: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        textShimmer: {
          '0%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'theme-grid': 'linear-gradient(transparent 97%, var(--color-border) 98%), linear-gradient(90deg, transparent 97%, var(--color-border) 98%)',
        'theme-scanline': 'linear-gradient(to bottom, transparent 50%, var(--color-primary/0.05) 50%)',
        'theme-glow': 'linear-gradient(180deg, var(--color-primary/0.3) 0%, transparent 100%)',
      },
      boxShadow: {
        theme: '0 0 5px var(--color-primary), 0 0 10px var(--color-primary), 0 0 15px var(--color-primary)',
        'theme-strong': '0 0 10px var(--color-primary), 0 0 20px var(--color-primary), 0 0 30px var(--color-primary)',
        'theme-box': '0 0 5px var(--color-primary), 0 0 10px var(--color-primary), inset 0 0 5px var(--color-primary)',
      },
    },
  },
  plugins: [
    function({ addBase }) {
      addBase({
        ':root': {
          '--color-background': colors.white,
          '--color-paper': colors.gray[50],
          '--color-primary': colors.blue[500],
          '--color-secondary': colors.gray[500],
          '--color-accent': colors.blue[600],
          '--color-success': colors.green[500],
          '--color-warning': colors.yellow[500],
          '--color-error': colors.red[500],
          '--color-info': colors.blue[500],
          '--color-border': colors.gray[200],
          '--color-text-primary': colors.gray[900],
          '--color-text-secondary': colors.gray[600],
          '--color-text-muted': colors.gray[400],
        },
        '.dark': {
          '--color-background': colors.gray[900],
          '--color-paper': colors.gray[800],
          '--color-primary': colors.gray[100],
          '--color-secondary': colors.gray[300],
          '--color-accent': colors.gray[400],
          '--color-success': colors.green[500],
          '--color-warning': colors.yellow[500],
          '--color-error': colors.red[500],
          '--color-info': colors.blue[500],
          '--color-border': colors.gray[700],
          '--color-text-primary': colors.gray[100],
          '--color-text-secondary': colors.gray[300],
          '--color-text-muted': colors.gray[500],
        },
        '.theme-cyberpunk': {
          '--color-background': '#000033',
          '--color-paper': '#000044',
          '--color-primary': '#ffffff',
          '--color-secondary': '#0ff',
          '--color-accent': '#00ffff80',
          '--color-success': colors.green[500],
          '--color-warning': colors.yellow[500],
          '--color-error': colors.red[500],
          '--color-info': colors.blue[500],
          '--color-border': colors.gray[200],
          '--color-text-primary': '#ffffff',
          '--color-text-secondary': '#0ff',
          '--color-text-muted': '#00ffff80',
        },
        '.theme-neon': {
          '--color-background': '#0a0a0f',
          '--color-paper': '#050507',
          '--color-primary': '#0ff',
          '--color-secondary': '#0ff80',
          '--color-accent': '#00ffff40',
          '--color-success': colors.green[500],
          '--color-warning': colors.yellow[500],
          '--color-error': colors.red[500],
          '--color-info': colors.blue[500],
          '--color-border': '#0ff20',
          '--color-text-primary': '#ffffff',
          '--color-text-secondary': '#0ff',
          '--color-text-muted': '#0ff80',
        },
        '.theme-plasma': {
          '--color-background': '#0a0a0f',
          '--color-paper': '#050507',
          '--color-primary': '#ff00ff',
          '--color-secondary': '#ff00ff80',
          '--color-accent': '#ff00ff40',
          '--color-success': colors.green[500],
          '--color-warning': colors.yellow[500],
          '--color-error': colors.red[500],
          '--color-info': colors.blue[500],
          '--color-border': '#ff00ff20',
          '--color-text-primary': '#ffffff',
          '--color-text-secondary': '#ff00ff',
          '--color-text-muted': '#ff00ff80',
        },
        '.theme-quantum': {
          '--color-background': '#0a0a0f',
          '--color-paper': '#050507',
          '--color-primary': '#ffff00',
          '--color-secondary': '#ffff0080',
          '--color-accent': '#ffff0040',
          '--color-success': colors.green[500],
          '--color-warning': colors.yellow[500],
          '--color-error': colors.red[500],
          '--color-info': colors.blue[500],
          '--color-border': '#ffff0020',
          '--color-text-primary': '#ffffff',
          '--color-text-secondary': '#ffff00',
          '--color-text-muted': '#ffff0080',
        },
        '.theme-modern': {
          '--color-background': '#ffffff',
          '--color-paper': '#ffffff',
          '--color-primary': '#1e293b',
          '--color-secondary': '#64748b',
          '--color-accent': '#94a3b8',
          '--color-success': colors.green[500],
          '--color-warning': colors.yellow[500],
          '--color-error': colors.red[500],
          '--color-info': colors.blue[500],
          '--color-border': colors.gray[200],
          '--color-text-primary': '#1e293b',
          '--color-text-secondary': '#64748b',
          '--color-text-muted': '#94a3b8',
        },
        '.theme-minimal': {
          '--color-background': '#fafafa',
          '--color-paper': '#ffffff',
          '--color-primary': '#171717',
          '--color-secondary': '#525252',
          '--color-accent': '#737373',
          '--color-success': colors.green[500],
          '--color-warning': colors.yellow[500],
          '--color-error': colors.red[500],
          '--color-info': colors.blue[500],
          '--color-border': colors.gray[200],
          '--color-text-primary': '#171717',
          '--color-text-secondary': '#525252',
          '--color-text-muted': '#737373',
        },
      });
    },
  ],
}