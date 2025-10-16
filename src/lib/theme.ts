// Global theme configuration for Insurance CRM
export const theme = {
  // Primary color palette
  colors: {
    // Primary brand colors
    primary: {
      50: '#EFF6FF',
      100: '#DBEAFE',
      200: '#BFDBFE',
      300: '#93C5FD',
      400: '#60A5FA',
      500: '#3B82F6', // Main primary
      600: '#2563EB',
      700: '#1D4ED8',
      800: '#1E40AF',
      900: '#1E3A8A',
    },
    // Secondary colors
    secondary: {
      50: '#F0FDF4',
      100: '#DCFCE7',
      200: '#BBF7D0',
      300: '#86EFAC',
      400: '#4ADE80',
      500: '#22C55E',
      600: '#16A34A',
      700: '#15803D',
      800: '#166534',
      900: '#14532D',
    },
    // Status colors
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    // Neutral colors
    gray: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },
  },
  // Typography
  typography: {
    fontFamily: {
      sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
    },
    fontSize: {
      xs: '0.75rem',     // 12px
      sm: '0.875rem',    // 14px
      base: '1rem',      // 16px
      lg: '1.125rem',    // 18px
      xl: '1.25rem',     // 20px
      '2xl': '1.5rem',   // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  // Spacing scale
  spacing: {
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
  },
  // Border radius
  borderRadius: {
    none: '0',
    sm: '0.25rem',   // 4px
    base: '0.5rem',  // 8px
    md: '0.75rem',   // 12px
    lg: '1rem',      // 16px
    xl: '1.5rem',    // 24px
    '2xl': '2rem',   // 32px
    full: '9999px',
  },
  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
  // Transitions
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
  // Z-index layers
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
} as const;

// Component-specific design tokens
export const components = {
  button: {
    // Button variants
    primary: {
      bg: theme.colors.primary[600],
      hoverBg: theme.colors.primary[700],
      activeBg: theme.colors.primary[800],
      text: '#FFFFFF',
    },
    secondary: {
      bg: theme.colors.gray[100],
      hoverBg: theme.colors.gray[200],
      activeBg: theme.colors.gray[300],
      text: theme.colors.gray[800],
    },
    success: {
      bg: theme.colors.success,
      hoverBg: '#16A34A',
      activeBg: '#15803D',
      text: '#FFFFFF',
    },
    danger: {
      bg: theme.colors.error,
      hoverBg: '#DC2626',
      activeBg: '#B91C1C',
      text: '#FFFFFF',
    },
    ghost: {
      bg: 'transparent',
      hoverBg: theme.colors.gray[100],
      activeBg: theme.colors.gray[200],
      text: theme.colors.gray[700],
    },
    // Button sizes
    sizes: {
      sm: {
        padding: '0.5rem 1rem',
        fontSize: theme.typography.fontSize.sm,
        height: '2rem',
      },
      md: {
        padding: '0.625rem 1.25rem',
        fontSize: theme.typography.fontSize.base,
        height: '2.5rem',
      },
      lg: {
        padding: '0.75rem 1.5rem',
        fontSize: theme.typography.fontSize.lg,
        height: '3rem',
      },
    },
  },
  card: {
    bg: '#FFFFFF',
    border: theme.colors.gray[200],
    shadow: theme.shadows.base,
    hoverShadow: theme.shadows.md,
    padding: theme.spacing[6],
    radius: theme.borderRadius.lg,
  },
  input: {
    bg: '#FFFFFF',
    border: theme.colors.gray[300],
    focusBorder: theme.colors.primary[500],
    errorBorder: theme.colors.error,
    text: theme.colors.gray[900],
    placeholder: theme.colors.gray[400],
    padding: '0.625rem 0.875rem',
    radius: theme.borderRadius.md,
    height: '2.5rem',
  },
  modal: {
    backdrop: 'rgba(0, 0, 0, 0.5)',
    bg: '#FFFFFF',
    shadow: theme.shadows.xl,
    radius: theme.borderRadius.xl,
    padding: theme.spacing[6],
  },
  badge: {
    variants: {
      primary: {
        bg: theme.colors.primary[100],
        text: theme.colors.primary[800],
      },
      success: {
        bg: '#DCFCE7',
        text: '#166534',
      },
      warning: {
        bg: '#FEF3C7',
        text: '#92400E',
      },
      error: {
        bg: '#FEE2E2',
        text: '#991B1B',
      },
      gray: {
        bg: theme.colors.gray[100],
        text: theme.colors.gray[700],
      },
    },
  },
  table: {
    headerBg: theme.colors.gray[50],
    headerText: theme.colors.gray[700],
    borderColor: theme.colors.gray[200],
    hoverBg: theme.colors.gray[50],
    stripedBg: theme.colors.gray[50],
  },
} as const;

// Status color mapping
export const statusColors = {
  // Lead statuses
  NEW: { bg: '#DBEAFE', text: '#1E40AF' },
  CONTACTED: { bg: '#FEF3C7', text: '#92400E' },
  QUALIFIED: { bg: '#D1FAE5', text: '#065F46' },
  PROPOSAL_SENT: { bg: '#E0E7FF', text: '#3730A3' },
  NEGOTIATION: { bg: '#FCE7F3', text: '#831843' },
  CONVERTED: { bg: '#D1FAE5', text: '#065F46' },
  LOST: { bg: '#FEE2E2', text: '#991B1B' },
  ON_HOLD: { bg: '#F3F4F6', text: '#374151' },

  // Task priorities
  PRIORITY_1: { bg: '#FEE2E2', text: '#991B1B', label: 'Critical' },
  PRIORITY_2: { bg: '#FED7AA', text: '#9A3412', label: 'High' },
  PRIORITY_3: { bg: '#FEF3C7', text: '#92400E', label: 'Medium' },
  PRIORITY_4: { bg: '#DBEAFE', text: '#1E40AF', label: 'Low' },
  PRIORITY_5: { bg: '#F3F4F6', text: '#374151', label: 'Lowest' },
} as const;

// Helper function to get status color
export const getStatusColor = (status: string) => {
  return statusColors[status as keyof typeof statusColors] || { bg: '#F3F4F6', text: '#374151' };
};

export type Theme = typeof theme;
export type Components = typeof components;
