import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../lib/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

const variantClass: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'btn btn-primary',
  ghost: 'btn btn-ghost',
  success: 'btn btn-success',
  danger: 'btn',
};

export function Button({ variant = 'primary', size = 'md', className, children, ...rest }: ButtonProps) {
  const sizeClass = size === 'sm' ? 'text-sm px-3 py-1.5' : size === 'lg' ? 'text-lg px-5 py-3' : '';
  const dangerStyle = variant === 'danger' ? { background: 'var(--danger)', color: 'white' } : undefined;
  return (
    <button className={cn(variantClass[variant], sizeClass, 'focus-ring', className)} style={dangerStyle} {...rest}>
      {children}
    </button>
  );
}