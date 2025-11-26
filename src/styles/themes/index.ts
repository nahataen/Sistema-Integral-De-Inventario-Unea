// Theme configurations - Black Glassmorphism Theme

export interface GlassmorphismTheme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    shadow: string;
  };
  effects: {
    blur: string;
    borderRadius: string;
    shadow: string;
  };
}

export const blackGlassmorphismTheme: GlassmorphismTheme = {
  name: 'Black Glassmorphism',
  colors: {
    primary: 'rgba(37, 99, 235, 0.6)',
    secondary: 'rgba(15, 15, 25, 0.7)',
    accent: 'rgba(6, 182, 212, 0.6)',
    background: 'rgba(5, 5, 10, 0.9)',
    surface: 'rgba(15, 15, 25, 0.6)',
    text: '#ffffff',
    textSecondary: '#b0b0b0',
    border: 'rgba(255, 255, 255, 0.1)',
    shadow: 'rgba(0, 0, 0, 0.4)'
  },
  effects: {
    blur: 'backdrop-filter: blur(15px)',
    borderRadius: '0.75rem',
    shadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
  }
};

// Utility functions for theme application
export const applyGlassmorphism = (element: HTMLElement, theme: GlassmorphismTheme = blackGlassmorphismTheme) => {
  element.style.background = theme.colors.surface;
  element.style.border = `1px solid ${theme.colors.border}`;
  element.style.borderRadius = theme.effects.borderRadius;
  element.style.backdropFilter = 'blur(15px)';
  element.style.boxShadow = theme.effects.shadow;
  element.style.color = theme.colors.text;
};

export const createGlassButton = (theme: GlassmorphismTheme = blackGlassmorphismTheme) => ({
  background: theme.colors.primary,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: '0.5rem',
  color: theme.colors.text,
  backdropFilter: 'blur(10px)',
  transition: 'all 0.2s ease',
  cursor: 'pointer'
});

export const createGlassInput = (theme: GlassmorphismTheme = blackGlassmorphismTheme) => ({
  background: 'rgba(20, 20, 30, 0.6)',
  border: `1px solid ${theme.colors.border}`,
  borderRadius: '0.5rem',
  color: theme.colors.text,
  backdropFilter: 'blur(12px)',
  transition: 'all 0.2s ease'
});

// Light Glassmorphism Theme
export const lightGlassmorphismTheme: GlassmorphismTheme = {
  name: 'Light Glassmorphism',
  colors: {
    primary: 'rgba(37, 99, 235, 0.8)',
    secondary: 'rgba(248, 249, 250, 0.9)',
    accent: 'rgba(6, 182, 212, 0.8)',
    background: '#f8f9fa',
    surface: 'rgba(255, 255, 255, 0.95)',
    text: '#212529',
    textSecondary: '#6c757d',
    border: 'rgba(0, 0, 0, 0.1)',
    shadow: 'rgba(0, 0, 0, 0.05)'
  },
  effects: {
    blur: 'backdrop-filter: blur(15px)',
    borderRadius: '0.75rem',
    shadow: '0 4px 16px rgba(0, 0, 0, 0.05)'
  }
};

// Default export (dark theme as default)
export default blackGlassmorphismTheme;