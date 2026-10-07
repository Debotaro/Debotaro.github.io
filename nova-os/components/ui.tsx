import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

export function cn(...values: ClassValue[]) { return twMerge(clsx(values)); }
const buttonVariants = cva('button', { variants: { variant: { primary: 'button-primary', secondary: 'button-secondary', ghost: 'button-ghost' }, size: { default: '', small: 'button-small', icon: 'button-icon' } }, defaultVariants: { variant: 'primary', size: 'default' } });
export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>>(({className, variant, size, ...props}, ref) => <button ref={ref} className={cn(buttonVariants({variant,size}),className)} {...props}/>);
Button.displayName = 'Button';
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({className,...props},ref)=><input ref={ref} className={cn('input',className)} {...props}/>);
Input.displayName = 'Input';
export function Modal({open,onOpenChange,title,description,children}: {open:boolean;onOpenChange:(open:boolean)=>void;title:string;description?:string;children:ReactNode}) { return <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}><DialogPrimitive.Portal><DialogPrimitive.Overlay className="dialog-overlay"/><DialogPrimitive.Content className="dialog-content"><div className="dialog-header"><DialogPrimitive.Title>{title}</DialogPrimitive.Title><DialogPrimitive.Close className="icon-button" aria-label="Close dialog"><X size={18}/></DialogPrimitive.Close></div><DialogPrimitive.Description className="muted text-sm">{description || 'Update your local demo workspace.'}</DialogPrimitive.Description><div className="dialog-body">{children}</div></DialogPrimitive.Content></DialogPrimitive.Portal></DialogPrimitive.Root>; }
