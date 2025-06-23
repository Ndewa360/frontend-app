import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'textarea';
export type InputSize = 'sm' | 'md' | 'lg';
export type InputVariant = 'default' | 'filled' | 'outlined';

@Component({
  selector: 'app-modern-input',
  templateUrl: './modern-input.component.html',
  styleUrls: ['./modern-input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ModernInputComponent),
      multi: true
    }
  ]
})
export class ModernInputComponent implements ControlValueAccessor {
  @Input() type: InputType = 'text';
  @Input() variant: InputVariant = 'default';
  @Input() size: InputSize = 'md';
  @Input() label?: string;
  @Input() placeholder?: string;
  @Input() description?: string;
  @Input() helpText?: string;
  @Input() error?: string;
  @Input() leftIcon?: string;
  @Input() rightIcon?: string;
  @Input() disabled: boolean = false;
  @Input() readonly: boolean = false;
  @Input() required: boolean = false;
  @Input() loading: boolean = false;
  @Input() clearable: boolean = false;
  @Input() showCharCount: boolean = false;
  
  // Attributs spécifiques
  @Input() min?: number;
  @Input() max?: number;
  @Input() step?: number;
  @Input() maxlength?: number;
  @Input() pattern?: string;
  @Input() autocomplete?: string;
  @Input() rows: number = 3; // Pour textarea
  
  @Output() inputChange = new EventEmitter<string>();
  @Output() inputFocus = new EventEmitter<Event>();
  @Output() inputBlur = new EventEmitter<Event>();
  @Output() keydown = new EventEmitter<KeyboardEvent>();
  @Output() cleared = new EventEmitter<void>();

  value: string = '';
  focused: boolean = false;
  touched: boolean = false;
  passwordVisible: boolean = false;
  inputId: string = `input-${Math.random().toString(36).substr(2, 9)}`;

  // ControlValueAccessor
  private onChange = (value: string) => {};
  private onTouched = () => {};

  get showPasswordToggle(): boolean {
    return this.type === 'password';
  }

  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    this.value = target.value;
    this.onChange(this.value);
    this.inputChange.emit(this.value);
  }

  onFocus(event: Event): void {
    this.focused = true;
    this.inputFocus.emit(event);
  }

  onBlur(event: Event): void {
    this.focused = false;
    this.touched = true;
    this.onTouched();
    this.inputBlur.emit(event);
  }

  onKeydown(event: KeyboardEvent): void {
    this.keydown.emit(event);
  }

  onClear(): void {
    this.value = '';
    this.onChange(this.value);
    this.inputChange.emit(this.value);
    this.cleared.emit();
  }

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  getInputType(): string {
    if (this.type === 'password') {
      return this.passwordVisible ? 'text' : 'password';
    }
    return this.type;
  }

  getContainerClasses(): string {
    return 'w-full';
  }

  getLabelClasses(): string {
    const baseClasses = 'block font-medium mb-1';
    const sizeClasses = {
      sm: 'text-sm',
      md: 'text-sm',
      lg: 'text-base'
    };
    const colorClasses = this.error && this.touched ? 'text-red-700' : 'text-gray-700';

    return `${baseClasses} ${sizeClasses[this.size]} ${colorClasses}`;
  }

  getDescriptionClasses(): string {
    return 'text-sm text-gray-600 mb-2';
  }

  getInputContainerClasses(): string {
    return this.label ? 'mt-1' : '';
  }

  getInputClasses(): string {
    const baseClasses = 'block w-full transition-colors duration-200 focus:outline-none';
    const variantClasses = this.getVariantClasses();
    const sizeClasses = this.getSizeClasses();
    const stateClasses = this.getStateClasses();
    const paddingClasses = this.getPaddingClasses();

    return `${baseClasses} ${variantClasses} ${sizeClasses} ${stateClasses} ${paddingClasses}`.trim();
  }

  getTextareaClasses(): string {
    const baseClasses = 'block w-full resize-y transition-colors duration-200 focus:outline-none';
    const variantClasses = this.getVariantClasses();
    const sizeClasses = this.getSizeClasses();
    const stateClasses = this.getStateClasses();
    const paddingClasses = this.getPaddingClasses();

    return `${baseClasses} ${variantClasses} ${sizeClasses} ${stateClasses} ${paddingClasses}`.trim();
  }

  private getVariantClasses(): string {
    const variants = {
      default: 'border border-gray-300 rounded-lg bg-white',
      filled: 'border-0 rounded-lg bg-gray-100',
      outlined: 'border-2 border-gray-300 rounded-lg bg-white'
    };

    return variants[this.variant];
  }

  private getSizeClasses(): string {
    const sizes = {
      sm: 'text-sm',
      md: 'text-sm',
      lg: 'text-base'
    };

    return sizes[this.size];
  }

  private getStateClasses(): string {
    if (this.disabled) {
      return 'bg-gray-100 text-gray-500 cursor-not-allowed';
    }

    if (this.error && this.touched) {
      return 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500';
    }

    if (this.focused) {
      return 'ring-2 ring-blue-500 border-blue-500';
    }

    return 'hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500';
  }

  private getPaddingClasses(): string {
    const leftPadding = this.leftIcon ? 'pl-10' : 'pl-3';
    const rightPadding = (this.rightIcon || this.clearable || this.showPasswordToggle || this.loading) ? 'pr-10' : 'pr-3';
    
    const verticalPadding = {
      sm: 'py-2',
      md: 'py-2.5',
      lg: 'py-3'
    };

    return `${leftPadding} ${rightPadding} ${verticalPadding[this.size]}`;
  }

  getIconClasses(): string {
    const colorClasses = this.error && this.touched ? 'text-red-400' : 'text-gray-400';
    return `h-5 w-5 ${colorClasses}`;
  }

  getCharCountClasses(): string {
    const isNearLimit = this.maxlength && this.value && (this.value.length / this.maxlength) > 0.8;
    const isOverLimit = this.maxlength && this.value && this.value.length > this.maxlength;
    
    if (isOverLimit) {
      return 'text-xs text-red-600';
    }
    if (isNearLimit) {
      return 'text-xs text-yellow-600';
    }
    return 'text-xs text-gray-500';
  }

  getErrorClasses(): string {
    return 'mt-1 text-sm text-red-600';
  }

  getHelpClasses(): string {
    return 'mt-1 text-sm text-gray-600';
  }
}
