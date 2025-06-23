import { Component, Input, Output, EventEmitter } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost' | 'outline';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

@Component({
  selector: 'app-modern-button',
  templateUrl: './modern-button.component.html',
  styleUrls: ['./modern-button.component.scss']
})
export class ModernButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Input() iconOnly: boolean = false;
  @Input() leftIcon?: string;
  @Input() rightIcon?: string;
  @Input() badge?: string | number;
  @Input() fullWidth: boolean = false;
  @Input() rounded: boolean = false;

  @Output() clicked = new EventEmitter<Event>();

  onClick(event: Event): void {
    if (!this.disabled && !this.loading) {
      this.clicked.emit(event);
    }
  }

  getButtonClasses(): string {
    const baseClasses = 'relative';
    const variantClasses = this.getVariantClasses();
    const sizeClasses = this.getSizeClasses();
    const shapeClasses = this.getShapeClasses();
    const widthClasses = this.fullWidth ? 'w-full' : '';

    return `${baseClasses} ${variantClasses} ${sizeClasses} ${shapeClasses} ${widthClasses}`.trim();
  }

  private getVariantClasses(): string {
    const variants = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm',
      secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 shadow-sm',
      success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 shadow-sm',
      warning: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500 shadow-sm',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm',
      ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
      outline: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-blue-500'
    };

    return variants[this.variant] || variants.primary;
  }

  private getSizeClasses(): string {
    if (this.iconOnly) {
      const iconSizes = {
        xs: 'h-6 w-6 p-1',
        sm: 'h-8 w-8 p-1.5',
        md: 'h-10 w-10 p-2',
        lg: 'h-12 w-12 p-2.5',
        xl: 'h-14 w-14 p-3'
      };
      return iconSizes[this.size] || iconSizes.md;
    }

    const sizes = {
      xs: 'px-2 py-1 text-xs',
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
      xl: 'px-8 py-4 text-lg'
    };

    return sizes[this.size] || sizes.md;
  }

  private getShapeClasses(): string {
    if (this.rounded) {
      return this.iconOnly ? 'rounded-full' : 'rounded-full';
    }
    return 'rounded-lg';
  }

  getIconClasses(position: 'left' | 'right'): string {
    if (this.iconOnly) {
      const iconSizes = {
        xs: 'h-4 w-4',
        sm: 'h-5 w-5',
        md: 'h-6 w-6',
        lg: 'h-7 w-7',
        xl: 'h-8 w-8'
      };
      return iconSizes[this.size] || iconSizes.md;
    }

    const baseClasses = 'h-4 w-4';
    const positionClasses = position === 'left' ? 'mr-2' : 'ml-2';
    
    return `${baseClasses} ${positionClasses}`;
  }

  getTextClasses(): string {
    return this.loading ? 'opacity-75' : '';
  }
}
