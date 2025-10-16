import React from 'react';
import { components } from '@/lib/theme';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'gray';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ children, variant = 'gray', size = 'md', dot = false, className = '', ...props }, ref) => {
    const variantStyles = components.badge.variants[variant];

    const sizeClasses = {
      sm: 'text-xs px-2 py-0.5',
      md: 'text-sm px-2.5 py-0.5',
      lg: 'text-base px-3 py-1',
    };

    const baseStyles = `
      inline-flex items-center gap-1.5
      font-medium rounded-full
      ${sizeClasses[size]}
      ${className}
    `;

    const styles = {
      backgroundColor: variantStyles.bg,
      color: variantStyles.text,
    };

    return (
      <span ref={ref} className={baseStyles} style={styles} {...props}>
        {dot && (
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: variantStyles.text }}
          />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: string;
}

export const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, ...props }, ref) => {
    const statusColorMap: Record<string, BadgeProps['variant']> = {
      NEW: 'primary',
      CONTACTED: 'warning',
      QUALIFIED: 'success',
      PROPOSAL_SENT: 'primary',
      NEGOTIATION: 'warning',
      CONVERTED: 'success',
      LOST: 'error',
      ON_HOLD: 'gray',
      COMPLETED: 'success',
      IN_PROGRESS: 'warning',
      PENDING: 'gray',
    };

    const variant = statusColorMap[status] || 'gray';

    return (
      <Badge ref={ref} variant={variant} {...props}>
        {status.replace(/_/g, ' ')}
      </Badge>
    );
  }
);

StatusBadge.displayName = 'StatusBadge';
