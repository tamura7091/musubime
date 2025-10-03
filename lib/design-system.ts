// Design System - Colors
export const colors = {
  // Background colors
  dark: {
    bg: '#000000', // True black like iOS
    card: '#1c1c1e', // Card background - iOS system gray 6
    border: '#38383a', // iOS system gray 5
  },
  light: {
    bg: '#f2f2f7', // iOS system gray 6 light
    card: '#ffffff', // Keep cards pure white for contrast
    border: '#d1d1d6', // iOS system gray 4 light
  },
  
  // Text colors
  text: {
    primary: '#ffffff', // Primary text (pure white for better contrast)
    secondary: '#8e8e93', // iOS system gray
    accent: '#0a84ff', // iOS blue
    accentHover: '#0040dd', // iOS blue pressed
  },
  textLight: {
    primary: '#000000', // iOS label
    secondary: '#8e8e93', // iOS secondary label  
    accent: '#007aff', // iOS blue light
    accentHover: '#0051d5', // iOS blue light pressed
  },
  
  // Status colors
  status: {
    blue: {
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      bg: 'rgba(59, 130, 246, 0.2)',
      border: 'rgba(59, 130, 246, 0.3)',
    },
    orange: {
      300: '#fdba74',
      400: '#fb923c',
      500: '#f97316',
      600: '#ea580c',
      bg: 'rgba(249, 115, 22, 0.2)',
      border: 'rgba(249, 115, 22, 0.3)',
    },
    purple: {
      400: '#a78bfa',
      500: '#8b5cf6',
      600: '#7c3aed',
      bg: 'rgba(139, 92, 246, 0.2)',
      border: 'rgba(139, 92, 246, 0.3)',
    },
    indigo: {
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1',
      600: '#4f46e5',
      bg: 'rgba(99, 102, 241, 0.2)',
      border: 'rgba(99, 102, 241, 0.3)',
    },
    emerald: {
      400: '#34d399',
      500: '#10b981',
      600: '#059669',
      bg: 'rgba(16, 185, 129, 0.2)',
      border: 'rgba(16, 185, 129, 0.3)',
    },
    green: {
      300: '#86efac',
      600: '#16a34a',
      bg: 'rgba(22, 163, 74, 0.2)',
      border: 'rgba(22, 163, 74, 0.3)',
    },
    cyan: {
      400: '#22d3ee',
      500: '#06b6d4',
      600: '#0891b2',
      bg: 'rgba(6, 182, 212, 0.2)',
      border: 'rgba(6, 182, 212, 0.3)',
    },
    gray: {
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      bg: 'rgba(107, 114, 128, 0.2)',
      border: 'rgba(107, 114, 128, 0.3)',
    },
    red: {
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      bg: 'rgba(239, 68, 68, 0.1)',
      border: 'rgba(239, 68, 68, 0.2)',
    },
    yellow: {
      400: '#facc15',
      500: '#eab308',
      600: '#ca8a04',
      bg: 'rgba(234, 179, 8, 0.2)',
      border: 'rgba(234, 179, 8, 0.3)',
    },
  },
  
  // Button colors
  button: {
    primary: {
      bg: '#007aff', // iOS blue
      hover: '#0051d5', // iOS blue pressed
      text: '#ffffff',
    },
    secondary: {
      bg: 'transparent',
      hover: 'rgba(255, 255, 255, 0.08)',
      text: '#8e8e93',
    },
  },
  
  // Form colors
  form: {
    input: {
      bg: '#1c1c1e', // iOS system gray 6
      border: '#38383a', // iOS system gray 5
      focus: {
        ring: '#007aff', // iOS blue
        border: 'transparent',
      },
    },
    inputLight: {
      bg: '#ffffff', // Pure white for inputs
      border: '#d1d1d6', // iOS system gray 4 light
      focus: {
        ring: '#007aff', // iOS blue
        border: 'transparent',
      },
    },
    placeholder: '#8e8e93', // iOS system gray
    placeholderLight: '#8e8e93', // iOS system gray
  },
  
  // Progress bar colors
  progress: {
    bg: '#38383a',
    fill: '#007aff', // iOS blue
  },
  progressLight: {
    bg: '#e5e5ea',
    fill: '#007aff', // iOS blue
  },
} as const;

// Typography scale for consistent headings across the app
export const typography = {
  heading: {
    // Primary page title
    h1: {
      fontSize: 24,
      lineHeight: 1.3,
      fontWeight: 700,
    },
    // Section titles
    h2: {
      fontSize: 20,
      lineHeight: 1.35,
      fontWeight: 600,
    },
    // Subsection titles
    h3: {
      fontSize: 16,
      lineHeight: 1.4,
      fontWeight: 600,
    },
  },
  text: {
    // Default body text
    base: {
      fontSize: 16,
      lineHeight: 1.6,
      fontWeight: 400,
    },
    // Subtle/smaller helper text
    sm: {
      fontSize: 14,
      lineHeight: 1.6,
      fontWeight: 400,
    },
    // Larger emphasis text
    lg: {
      fontSize: 18,
      lineHeight: 1.6,
      fontWeight: 400,
    },
  },
} as const;

// Helper function to get status colors
export const getStatusColors = (status: string) => {
  switch (status) {
    case 'not_started':
      return {
        bg: colors.status.gray.bg,
        text: colors.status.gray[300],
        border: colors.status.gray.border,
      };
    case 'meeting_scheduling':
      return {
        bg: colors.status.blue.bg,
        text: colors.status.blue[400],
        border: colors.status.blue.border,
      };
    case 'meeting_scheduled':
      return {
        bg: colors.status.blue.bg.replace('0.2', '0.3'),
        text: colors.status.blue[300],
        border: colors.status.blue.border.replace('0.3', '0.4'),
      };
    case 'plan_creating':
      return {
        bg: colors.status.orange.bg,
        text: colors.status.orange[400],
        border: colors.status.orange.border,
      };
    case 'plan_submitted':
      return {
        bg: colors.status.orange.bg.replace('0.2', '0.3'),
        text: colors.status.orange[300],
        border: colors.status.orange.border.replace('0.3', '0.4'),
      };
    case 'plan_revising':
      return {
        bg: colors.status.orange.bg,
        text: colors.status.orange[400],
        border: colors.status.orange.border,
      };
    case 'draft_creating':
      return {
        bg: colors.status.purple.bg,
        text: colors.status.purple[400],
        border: colors.status.purple.border,
      };
    case 'draft_submitted':
      return {
        bg: colors.status.purple.bg.replace('0.2', '0.3'),
        text: colors.status.purple[400],
        border: colors.status.purple.border.replace('0.3', '0.4'),
      };
    case 'draft_revising':
      return {
        bg: colors.status.indigo.bg,
        text: colors.status.indigo[400],
        border: colors.status.indigo.border,
      };
    case 'scheduling':
      return {
        bg: colors.status.emerald.bg,
        text: colors.status.emerald[400],
        border: colors.status.emerald.border,
      };
    case 'scheduled':
      return {
        bg: colors.status.green.bg,
        text: colors.status.green[300],
        border: colors.status.green.border,
      };
    case 'payment_processing':
      return {
        bg: colors.status.cyan.bg,
        text: colors.status.cyan[400],
        border: colors.status.cyan.border,
      };
    case 'completed':
      return {
        bg: colors.status.gray.bg,
        text: colors.status.gray[400],
        border: colors.status.gray.border,
      };
    case 'cancelled':
      return {
        bg: colors.status.red.bg,
        text: colors.status.red[400],
        border: colors.status.red.border,
      };
    default:
      return {
        bg: colors.status.gray.bg,
        text: colors.status.gray[400],
        border: colors.status.gray.border,
      };
  }
};

// Utility function to format large numbers into abbreviated form
export function formatAbbreviatedCurrency(amount: number, currency: string = 'JPY'): string {
  if (amount === 0) return `¥0`;
  
  const absAmount = Math.abs(amount);
  
  if (absAmount >= 1000000000) {
    // Billions
    const billions = absAmount / 1000000000;
    return `¥${billions.toFixed(1)}B`;
  } else if (absAmount >= 1000000) {
    // Millions
    const millions = absAmount / 1000000;
    return `¥${millions.toFixed(1)}M`;
  } else if (absAmount >= 1000) {
    // Thousands
    const thousands = absAmount / 1000;
    return `¥${thousands.toFixed(1)}K`;
  } else {
    // Less than 1000, show full number
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }
}
