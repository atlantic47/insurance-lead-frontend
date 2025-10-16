import React from 'react';
import { components } from '@/lib/theme';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  noPadding?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, hoverable = false, noPadding = false, className = '', style, ...props }, ref) => {
    const cardStyles = components.card;

    const baseStyles = `
      bg-white rounded-lg border transition-shadow duration-200
      ${hoverable ? 'cursor-pointer hover:shadow-md' : ''}
      ${!noPadding ? 'p-6' : ''}
      ${className}
    `;

    const defaultStyle = {
      backgroundColor: cardStyles.bg,
      borderColor: cardStyles.border,
      borderRadius: cardStyles.radius,
      boxShadow: cardStyles.shadow,
      ...style,
    };

    return (
      <div
        ref={ref}
        className={baseStyles}
        style={defaultStyle}
        {...props}
        onMouseEnter={(e) => {
          if (hoverable) {
            e.currentTarget.style.boxShadow = cardStyles.hoverShadow;
          }
        }}
        onMouseLeave={(e) => {
          if (hoverable) {
            e.currentTarget.style.boxShadow = cardStyles.shadow;
          }
        }}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ title, description, actions, children, className = '', ...props }, ref) => {
    return (
      <div ref={ref} className={`flex items-center justify-between mb-4 ${className}`} {...props}>
        <div className="flex-1">
          {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
          {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
          {children}
        </div>
        {actions && <div className="flex-shrink-0 ml-4">{actions}</div>}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

export const CardBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <div ref={ref} className={className} {...props}>
        {children}
      </div>
    );
  }
);

CardBody.displayName = 'CardBody';

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <div ref={ref} className={`mt-4 pt-4 border-t border-gray-200 ${className}`} {...props}>
        {children}
      </div>
    );
  }
);

CardFooter.displayName = 'CardFooter';
