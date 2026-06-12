/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Desert Craft — Primary accent (copper gold)
        brand:         '#C9974A',
        'brand-light': '#F5E6CC',
        'brand-muted': '#b07c35',
        'brand-dark':  '#8a5f22',

        // Omani teal
        'teal-400': '#1D6A72',
        'teal-200': '#7aadad',
        'teal-800': '#0f2828',

        // Terracotta
        terracotta:        '#E05A2B',
        'terracotta-light':'#FFE8DF',

        // Sand backgrounds
        'sand-50':  '#FDFAF6',
        'sand-100': '#FDF8F2',
        'sand-200': '#F5EDE0',
        'sand-300': '#e8e0d6',

        // Text
        'text-primary':       '#1a2e2e',
        'text-secondary':     '#6a8585',
        'text-muted':         '#7aadad',
        'text-on-dark':       '#ffffff',
        'text-on-dark-sub':   '#7aadad',
        'text-on-dark-muted': '#a8c5c5',

        // Category icon bg
        'icon-bg-amber': '#FFF0D6',
        'icon-bg-teal':  '#D6F0EF',
        'icon-bg-coral': '#FFE8DF',

        // Semantic aliases used in existing code
        primary: '#1D6A72',
      },
      borderRadius: {
        'input':  '12px',
        'card':   '16px',
        'btn':    '14px',
        'pill':   '24px',
        'icon':   '12px',
        'badge':  '9999px',
      },
      fontSize: {
        'screen-title': ['20px', {fontWeight: '600'}],
        'section':      ['16px', {fontWeight: '600'}],
        'body':         ['14px', {fontWeight: '400'}],
        'body-sm':      ['13px', {fontWeight: '400'}],
        'secondary':    ['12px', {fontWeight: '400'}],
        'field-label':  ['10px', {fontWeight: '600', letterSpacing: '0.8px'}],
        'card-title':   ['11px', {fontWeight: '600'}],
        'card-desc':    ['10px', {fontWeight: '400'}],
      },
      boxShadow: {
        'card':   '0 2px 12px rgba(0,0,0,0.08)',
        'input':  '0 0 0 2px rgba(201,151,74,0.25)',
        'header': '0 4px 24px rgba(15,40,40,0.3)',
      },
    },
  },
  plugins: [],
};
