import { Component, Input, Output, EventEmitter, ContentChild, TemplateRef, AfterContentInit } from '@angular/core';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'filled';
export type CardSize = 'sm' | 'md' | 'lg';
export type StatusType = 'success' | 'warning' | 'error' | 'info' | 'neutral';

@Component({
  selector: 'app-modern-card',
  templateUrl: './modern-card.component.html',
  styleUrls: ['./modern-card.component.scss']
})
export class ModernCardComponent implements AfterContentInit {
  @Input() variant: CardVariant = 'default';
  @Input() size: CardSize = 'md';
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() status?: string;
  @Input() statusType: StatusType = 'neutral';
  @Input() imageUrl?: string;
  @Input() imageAlt?: string;
  @Input() imageBadge?: string;
  @Input() imageOverlay: boolean = false;
  @Input() clickable: boolean = false;
  @Input() loading: boolean = false;
  @Input() loadingText?: string;
  @Input() hover: boolean = true;
  @Input() rounded: boolean = true;
  @Input() shadow: boolean = true;

  @Output() cardClicked = new EventEmitter<Event>();
  @Output() imageError = new EventEmitter<Event>();

  @ContentChild('headerActions') headerActionsTemplate?: TemplateRef<any>;
  @ContentChild('footer') footerTemplate?: TemplateRef<any>;

  hasHeader: boolean = false;
  hasFooter: boolean = false;
  hasHeaderActions: boolean = false;

  ngAfterContentInit(): void {
    this.hasHeader = !!(this.title || this.subtitle || this.status || this.headerActionsTemplate);
    this.hasFooter = !!this.footerTemplate;
    this.hasHeaderActions = !!this.headerActionsTemplate;
  }

  onCardClick(event: Event): void {
    if (this.clickable && !this.loading) {
      this.cardClicked.emit(event);
    }
  }

  onImageError(event: Event): void {
    this.imageError.emit(event);
  }

  getCardClasses(): string {
    const baseClasses = 'relative bg-white overflow-hidden transition-all duration-200';
    const variantClasses = this.getVariantClasses();
    const sizeClasses = this.getSizeClasses();
    const interactionClasses = this.getInteractionClasses();
    const shapeClasses = this.rounded ? 'rounded-xl' : 'rounded-none';

    return `${baseClasses} ${variantClasses} ${sizeClasses} ${interactionClasses} ${shapeClasses}`.trim();
  }

  private getVariantClasses(): string {
    const variants = {
      default: this.shadow ? 'shadow-sm border border-gray-200' : 'border border-gray-200',
      elevated: 'shadow-lg border border-gray-100',
      outlined: 'border-2 border-gray-300',
      filled: 'bg-gray-50 border border-gray-200'
    };

    return variants[this.variant] || variants.default;
  }

  private getSizeClasses(): string {
    // Les tailles sont gérées principalement par le contenu
    return '';
  }

  private getInteractionClasses(): string {
    if (!this.clickable) return '';
    
    const hoverClasses = this.hover ? 'hover:shadow-lg hover:border-gray-300 hover:-translate-y-1' : '';
    const cursorClasses = 'cursor-pointer';
    const focusClasses = 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2';

    return `${hoverClasses} ${cursorClasses} ${focusClasses}`.trim();
  }

  getHeaderClasses(): string {
    const sizeClasses = {
      sm: 'p-4 pb-3',
      md: 'p-6 pb-4',
      lg: 'p-8 pb-6'
    };

    const baseClasses = 'flex items-start justify-between border-b border-gray-100';
    return `${baseClasses} ${sizeClasses[this.size]}`;
  }

  getTitleClasses(): string {
    const sizeClasses = {
      sm: 'text-lg',
      md: 'text-xl',
      lg: 'text-2xl'
    };

    return `font-semibold text-gray-900 truncate ${sizeClasses[this.size]}`;
  }

  getSubtitleClasses(): string {
    const sizeClasses = {
      sm: 'text-sm',
      md: 'text-sm',
      lg: 'text-base'
    };

    return `text-gray-600 mt-1 ${sizeClasses[this.size]}`;
  }

  getStatusBadgeClasses(): string {
    const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full';
    
    const statusClasses = {
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
      info: 'bg-blue-100 text-blue-800',
      neutral: 'bg-gray-100 text-gray-800'
    };

    return `${baseClasses} ${statusClasses[this.statusType]}`;
  }

  getImageClasses(): string {
    const baseClasses = 'w-full object-cover transition-transform duration-300';
    const hoverClasses = this.clickable && this.hover ? 'group-hover:scale-105' : '';
    
    const heightClasses = {
      sm: 'h-40',
      md: 'h-48',
      lg: 'h-56'
    };

    return `${baseClasses} ${hoverClasses} ${heightClasses[this.size]}`;
  }

  getImageBadgeClasses(): string {
    return 'px-2 py-1 bg-white bg-opacity-90 text-gray-900 text-xs font-medium rounded-full';
  }

  getContentClasses(): string {
    const sizeClasses = {
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8'
    };

    return sizeClasses[this.size];
  }

  getFooterClasses(): string {
    const sizeClasses = {
      sm: 'p-4 pt-3',
      md: 'p-6 pt-4',
      lg: 'p-8 pt-6'
    };

    const baseClasses = 'border-t border-gray-100 bg-gray-50';
    return `${baseClasses} ${sizeClasses[this.size]}`;
  }
}
