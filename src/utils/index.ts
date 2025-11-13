// Utility functions for Black Glassmorphism Theme

// Glassmorphism effect utilities
export const createGlassmorphismStyle = (opacity: number = 0.6, blur: number = 15) => ({
  background: `rgba(15, 15, 25, ${opacity})`,
  backdropFilter: `blur(${blur}px)`,
  WebkitBackdropFilter: `blur(${blur}px)`,
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '0.75rem',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
});

export const createGlassButtonStyle = (color: string = 'rgba(37, 99, 235, 0.3)') => ({
  background: color,
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '0.5rem',
  color: '#ffffff',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  backdropFilter: 'blur(10px)',
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
  }
});

export const createGlassInputStyle = () => ({
  background: 'rgba(20, 20, 30, 0.6)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '0.5rem',
  color: '#ffffff',
  padding: '0.75rem',
  transition: 'all 0.2s ease',
  backdropFilter: 'blur(12px)',
  '&:focus': {
    borderColor: 'rgba(59, 130, 246, 0.5)',
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.2)',
    outline: 'none'
  }
});

// Animation utilities
export const fadeInAnimation = {
  animation: 'fadeIn 0.3s ease-out'
};

export const scaleInAnimation = {
  animation: 'scaleIn 0.25s ease-out'
};

export const slideUpAnimation = {
  animation: 'slideUp 0.3s ease-out'
};

// CSS-in-JS keyframes (to be used with styled-components or similar)
export const glassmorphismKeyframes = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.9); }
    to { opacity: 1; transform: scale(1); }
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

// Color utilities
export const glassmorphismColors = {
  primary: 'rgba(37, 99, 235, 0.6)',
  secondary: 'rgba(15, 15, 25, 0.7)',
  accent: 'rgba(6, 182, 212, 0.6)',
  success: 'rgba(34, 197, 94, 0.6)',
  warning: 'rgba(245, 158, 11, 0.6)',
  error: 'rgba(239, 68, 68, 0.6)',
  background: 'rgba(5, 5, 10, 0.9)',
  surface: 'rgba(15, 15, 25, 0.6)',
  text: '#ffffff',
  textSecondary: '#b0b0b0',
  border: 'rgba(255, 255, 255, 0.1)',
  shadow: 'rgba(0, 0, 0, 0.4)'
};

// Responsive utilities
export const responsiveBreakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px'
};

export const createResponsiveStyle = (property: string, values: Record<string, string>) => {
  let styles = '';
  Object.entries(values).forEach(([breakpoint, value]) => {
    if (breakpoint === 'base') {
      styles += `${property}: ${value}; `;
    } else {
      styles += `@media (min-width: ${responsiveBreakpoints[breakpoint as keyof typeof responsiveBreakpoints]}) { ${property}: ${value}; } `;
    }
  });
  return styles.trim();
};

// Accessibility utilities
export const focusRing = {
  outline: '2px solid rgba(59, 130, 246, 0.5)',
  outlineOffset: '2px'
};

export const highContrastMode = {
  filter: 'contrast(1.2)',
  background: 'rgba(0, 0, 0, 0.95)'
};

// Performance utilities
export const willChangeAuto = {
  willChange: 'auto'
};

export const willChangeTransform = {
  willChange: 'transform'
};

export const containsPaint = {
  contain: 'paint'
};