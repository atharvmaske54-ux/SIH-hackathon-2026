export const lightTheme = {
  primary: '#36064D', 
  primaryLight: 'rgba(54, 6, 77, 0.1)',
  primaryMedium: 'rgba(54, 6, 77, 0.3)',
  safe: '#76D2DB',    
  safeLight: 'rgba(118, 210, 219, 0.15)',
  safeMedium: 'rgba(118, 210, 219, 0.4)',
  danger: '#DA4848',  
  dangerLight: 'rgba(218, 72, 72, 0.15)',
  dangerMedium: 'rgba(218, 72, 72, 0.4)',
  medium: '#F59E0B',
  mediumLight: 'rgba(245, 158, 11, 0.15)',
  background: '#F7F6E5', 
  card: '#FFFFFF',    
  text: '#36064D',    
  textSecondary: '#6B7280', 
  border: '#E5E7EB',
  white: '#FFFFFF',
};

export const darkTheme = {
  primary: '#BB86FC', 
  primaryLight: 'rgba(187, 134, 252, 0.15)',
  primaryMedium: 'rgba(187, 134, 252, 0.3)',
  safe: '#03DAC5',    
  safeLight: 'rgba(3, 218, 197, 0.15)',
  safeMedium: 'rgba(3, 218, 197, 0.4)',
  danger: '#FF0266',  
  dangerLight: 'rgba(255, 2, 102, 0.15)',
  dangerMedium: 'rgba(255, 2, 102, 0.4)',
  medium: '#FFB74D',
  mediumLight: 'rgba(255, 183, 77, 0.15)',
  background: '#121212', 
  card: '#1E1E1E',    
  text: '#FFFFFF',    
  textSecondary: '#A0A0A0', 
  border: '#333333',
  white: '#FFFFFF',
};

// Start with darkTheme as default
export let Colors = darkTheme;

export const setGlobalTheme = (theme: 'light' | 'dark') => {
  Colors = theme === 'dark' ? darkTheme : lightTheme;
};
