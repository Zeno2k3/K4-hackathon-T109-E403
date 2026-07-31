import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'ghost' | 'success' | 'dashed';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-blue text-white hover:bg-brand-blue-hover disabled:bg-[#cdd9ee] disabled:cursor-not-allowed',
  ghost: 'bg-white text-[#45536c] border border-border hover:bg-[#f0f4fa]',
  success:
    'bg-brand-green text-white hover:bg-brand-green-hover disabled:bg-[#bfe3d0] disabled:text-[#eef8f2] disabled:cursor-not-allowed',
  dashed:
    'bg-transparent border-[1.5px] border-dashed border-[#cdd9ee] text-brand-blue self-start hover:bg-[#f5f9ff]',
};

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`rounded-[10px] px-[18px] py-2.5 text-sm font-bold border border-transparent transition-colors ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
