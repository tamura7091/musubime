import { useTheme } from '@/contexts/ThemeContext';
import { colors, typography } from '@/lib/design-system';

export function useDesignSystem() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return {
    // Theme state
    isDark,
    resolvedTheme,
    
    // Background colors
    bg: {
      primary: isDark ? colors.dark.bg : colors.light.bg,
      card: isDark ? colors.dark.card : colors.light.card,
      surface: isDark ? '#2c2c2e' : '#e5e5ea', // iOS system gray 5
    },
    
    // Border colors
    border: {
      primary: isDark ? colors.dark.border : colors.light.border,
      secondary: isDark ? '#48484a' : '#d1d1d6', // iOS system gray 4
    },
    
    // Text colors
    text: {
      primary: isDark ? colors.text.primary : colors.textLight.primary,
      secondary: isDark ? colors.text.secondary : colors.textLight.secondary,
      accent: isDark ? colors.text.accent : colors.textLight.accent,
      accentHover: isDark ? colors.text.accentHover : colors.textLight.accentHover,
    },
    
    // Form colors
    form: {
      input: {
        bg: isDark ? colors.form.input.bg : colors.form.inputLight.bg,
        border: isDark ? colors.form.input.border : colors.form.inputLight.border,
        focus: {
          ring: colors.form.input.focus.ring,
          border: colors.form.input.focus.border,
        },
      },
      placeholder: isDark ? colors.form.placeholder : colors.form.placeholderLight,
    },
    
    // Button colors
    button: {
      primary: {
        bg: colors.button.primary.bg,
        hover: colors.button.primary.hover,
        text: colors.button.primary.text,
      },
      secondary: {
        bg: 'transparent',
        hover: isDark ? colors.button.secondary.hover : 'rgba(0, 0, 0, 0.05)',
        text: isDark ? colors.button.secondary.text : colors.textLight.secondary,
      },
    },
    
    // Progress colors
    progress: {
      bg: isDark ? colors.progress.bg : colors.progressLight.bg,
      fill: colors.progress.fill,
    },
    
    // Typography
    typography,
    
    // Alert colors
    alert: {
      error: {
        bg: isDark ? colors.alert.error.bgDark : colors.alert.error.bg,
        border: colors.alert.error.border,
        text: isDark ? colors.alert.error.textDark : colors.alert.error.text,
        icon: colors.alert.error.icon,
      },
      warning: {
        bg: isDark ? colors.alert.warning.bgDark : colors.alert.warning.bg,
        border: colors.alert.warning.border,
        text: isDark ? colors.alert.warning.textDark : colors.alert.warning.text,
        icon: colors.alert.warning.icon,
      },
      success: {
        bg: isDark ? colors.alert.success.bgDark : colors.alert.success.bg,
        border: colors.alert.success.border,
        text: isDark ? colors.alert.success.textDark : colors.alert.success.text,
        icon: colors.alert.success.icon,
      },
      info: {
        bg: isDark ? colors.alert.info.bgDark : colors.alert.info.bg,
        border: isDark ? colors.alert.info.borderDark : colors.alert.info.border,
        text: isDark ? colors.alert.info.textDark : colors.alert.info.text,
        icon: isDark ? colors.alert.info.iconDark : colors.alert.info.icon,
      },
    },
    
    // Shadow
    shadow: {
      card: isDark ? colors.shadow.card.dark : colors.shadow.card.light,
    },
    
    // Status colors
    status: {
      not_started: {
        bg: colors.status.gray.bg,
        text: isDark ? colors.status.gray[300] : colors.status.gray[500],
        border: colors.status.gray.border,
      },
      meeting_scheduling: {
        bg: colors.status.blue.bg,
        text: isDark ? colors.status.blue[400] : colors.status.blue[600],
        border: colors.status.blue.border,
      },
      meeting_scheduled: {
        bg: colors.status.blue.bg.replace('0.2', '0.3'),
        text: isDark ? colors.status.blue[300] : colors.status.blue[600],
        border: colors.status.blue.border.replace('0.3', '0.4'),
      },
      plan_creating: {
        bg: colors.status.orange.bg,
        text: isDark ? colors.status.orange[400] : colors.status.orange[600],
        border: colors.status.orange.border,
      },
      plan_submitted: {
        bg: colors.status.orange.bg.replace('0.2', '0.3'),
        text: isDark ? colors.status.orange[300] : colors.status.orange[600],
        border: colors.status.orange.border.replace('0.3', '0.4'),
      },
      
      plan_revising: {
        bg: colors.status.orange.bg,
        text: isDark ? colors.status.orange[400] : colors.status.orange[600],
        border: colors.status.orange.border,
      },
      draft_creating: {
        bg: colors.status.purple.bg,
        text: isDark ? colors.status.purple[400] : colors.status.purple[600],
        border: colors.status.purple.border,
      },
      draft_submitted: {
        bg: colors.status.indigo.bg,
        text: isDark ? colors.status.indigo[400] : colors.status.indigo[600],
        border: colors.status.indigo.border,
      },
      draft_revising: {
        bg: colors.status.indigo.bg,
        text: isDark ? colors.status.indigo[400] : colors.status.indigo[600],
        border: colors.status.indigo.border,
      },
      scheduling: {
        bg: colors.status.emerald.bg,
        text: isDark ? colors.status.emerald[400] : colors.status.emerald[600],
        border: colors.status.emerald.border,
      },
      scheduled: {
        bg: colors.status.green.bg,
        text: isDark ? colors.status.green[300] : colors.status.green[600],
        border: colors.status.green.border,
      },
      payment_processing: {
        bg: colors.status.cyan.bg,
        text: isDark ? colors.status.cyan[400] : colors.status.cyan[600],
        border: colors.status.cyan.border,
      },
      completed: {
        bg: colors.status.gray.bg,
        text: isDark ? colors.status.gray[400] : colors.status.gray[500],
        border: colors.status.gray.border,
      },
      cancelled: {
        bg: colors.status.red.bg,
        text: colors.status.red[400],
        border: colors.status.red.border,
      },
    },
    
    // Utility functions
    getStatusColors: (status: string) => {
      const statusColors = {
        not_started: {
          bg: colors.status.gray.bg,
          text: isDark ? colors.status.gray[300] : colors.status.gray[500],
          border: colors.status.gray.border,
        },
        meeting_scheduling: {
          bg: colors.status.blue.bg,
            text: isDark ? colors.status.blue[400] : colors.status.blue[600],
          border: colors.status.blue.border,
        },
        meeting_scheduled: {
          bg: colors.status.blue.bg.replace('0.2', '0.3'),
            text: isDark ? colors.status.blue[300] : colors.status.blue[600],
          border: colors.status.blue.border.replace('0.3', '0.4'),
        },
        plan_creating: {
          bg: colors.status.orange.bg,
            text: isDark ? colors.status.orange[400] : colors.status.orange[600],
          border: colors.status.orange.border,
        },
        plan_submitted: {
          bg: colors.status.orange.bg.replace('0.2', '0.3'),
            text: isDark ? colors.status.orange[300] : colors.status.orange[600],
          border: colors.status.orange.border.replace('0.3', '0.4'),
        },
        
        plan_revising: {
          bg: colors.status.orange.bg,
            text: isDark ? colors.status.orange[400] : colors.status.orange[600],
          border: colors.status.orange.border,
        },
        draft_creating: {
          bg: colors.status.purple.bg,
            text: isDark ? colors.status.purple[400] : colors.status.purple[600],
          border: colors.status.purple.border,
        },
        draft_submitted: {
            bg: colors.status.indigo.bg,
            text: isDark ? colors.status.indigo[400] : colors.status.indigo[600],
          border: colors.status.indigo.border,
        },
        draft_revising: {
            bg: colors.status.indigo.bg,
            text: isDark ? colors.status.indigo[400] : colors.status.indigo[600],
          border: colors.status.indigo.border,
        },
        scheduling: {
          bg: colors.status.emerald.bg,
            text: isDark ? colors.status.emerald[400] : colors.status.emerald[600],
          border: colors.status.emerald.border,
        },
        scheduled: {
          bg: colors.status.green.bg,
            text: isDark ? colors.status.green[300] : colors.status.green[600],
          border: colors.status.green.border,
        },
        payment_processing: {
          bg: colors.status.cyan.bg,
            text: isDark ? colors.status.cyan[400] : colors.status.cyan[600],
          border: colors.status.cyan.border,
        },
        completed: {
          bg: colors.status.gray.bg,
          text: colors.status.gray[400],
          border: colors.status.gray.border,
        },
        cancelled: {
          bg: colors.status.red.bg,
          text: colors.status.red[400],
          border: colors.status.red.border,
        },
      };
      
      return statusColors[status as keyof typeof statusColors] || statusColors.not_started;
    },
  };
}
