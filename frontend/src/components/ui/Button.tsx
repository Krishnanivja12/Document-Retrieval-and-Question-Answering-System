import React from 'react';

type ButtonVariant = 'primary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant = 'primary', size = 'md', loading = false, disabled, children, ...props }, ref) => {
        const baseStyles = 'font-medium rounded transition-all duration-200 flex items-center justify-center gap-2';

        const variantStyles = {
            primary: 'bg-black text-white hover:bg-gray-900 disabled:bg-gray-400',
            ghost: 'bg-transparent border border-gray-300 text-black hover:bg-gray-50 disabled:border-gray-200 disabled:text-gray-400',
            danger: 'bg-black text-white hover:bg-gray-800 disabled:bg-gray-400',
        };

        const sizeStyles = {
            sm: 'px-3 py-1.5 text-sm',
            md: 'px-4 py-2 text-base',
            lg: 'px-6 py-3 text-lg',
        };

        return (
            <button
                ref={ref}
                disabled={disabled || loading}
                className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]}`}
                {...props}
            >
                {loading && <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';

export default Button;


