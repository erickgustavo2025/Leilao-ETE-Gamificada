/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'press': ['"Press Start 2P"', 'cursive'], // Fonte dos Títulos (Pixelada)
        'vt323': ['"VT323"', 'monospace'],       // 👈 ADICIONEI AQUI: A salvadora dos acentos!
        'poppins': ['"Poppins"', 'sans-serif'],   // Fonte dos Textos (Leitura fácil)
        'mono': ['"Courier New"', 'monospace'],    // Fonte para Inputs/Códigos
      },
      colors: {
        ete: {
          dark: '#0F172A',   // Fundo Principal (Slate 900)
          light: '#1E293B',  // Fundo dos Cards (Slate 800)
          purple: '#8B5CF6', // Roxo Neon Principal
          yellow: '#FCD34D', // Amarelo Destaque (Botões)
          blue: '#3B82F6',   // Azul Neon
          green: '#10B981',  // Verde Sucesso
          red: '#EF4444',    // Vermelho Erro
        }
      },
      boxShadow: {
        'pixel': '4px 4px 0px 0px rgba(0,0,0,1)', // A sombra dura estilo botão de arcade
      },

      animation: {
        'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'glitch-1': 'glitch-1 0.3s infinite',
        'glitch-2': 'glitch-2 0.3s infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'glitch-1': {
          '0%, 100%': { transform: 'translate(0)' },
          '33%': { transform: 'translate(-2px, 2px)' },
          '66%': { transform: 'translate(2px, -2px)' },
        },
        'glitch-2': {
          '0%, 100%': { transform: 'translate(0)' },
          '33%': { transform: 'translate(2px, -2px)' },
          '66%': { transform: 'translate(-2px, 2px)' },
        },
      },
    },
  },
  plugins: [],
}