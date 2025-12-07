import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { ComponentPropsWithoutRef, forwardRef } from "react";
import { cn } from "@/lib/utils";

/**
 * ValidatedInput Props Interface
 * Extends standard HTML input props with validation states
 */
export interface ValidatedInputProps
  extends Omit<ComponentPropsWithoutRef<typeof Input>, "type"> {
  /**
   * Input label text
   */
  label: string;
  /**
   * Unique identifier for the input (required for accessibility)
   */
  id: string;
  /**
   * Error message to display below the input
   */
  error?: string;
  /**
   * Whether the input is currently being validated
   */
  isValidating?: boolean;
  /**
   * Input type (text, email, password, tel, etc.)
   */
  type?: string;
  /**
   * Whether the field is required
   */
  required?: boolean;
  /**
   * Additional hint text to display below the input
   */
  hint?: string;
  /**
   * Custom container class name
   */
  containerClassName?: string;
}

/**
 * ValidatedInput Component
 * 
 * A reusable form input component with built-in validation state display,
 * loading indicators, and error messages. Integrates seamlessly with
 * react-hook-form and provides consistent styling across signup forms.
 * 
 * Features:
 * - Automatic error state styling (red border)
 * - Loading spinner during async validation
 * - Required field indicator (*)
 * - Accessibility labels and ARIA attributes
 * - Optional hint text
 * 
 * @example
 * ```tsx
 * <ValidatedInput
 *   id="email"
 *   label="Email Address"
 *   type="email"
 *   error={errors.email?.message}
 *   isValidating={isCheckingEmail}
 *   required
 *   {...register("email")}
 * />
 * ```
 */
export const ValidatedInput = forwardRef<HTMLInputElement, ValidatedInputProps>(
  (
    {
      label,
      id,
      error,
      isValidating = false,
      type = "text",
      required = false,
      hint,
      containerClassName,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <div className={cn("space-y-2", containerClassName)}>
        {/* Label with required indicator */}
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>

        {/* Input with validation states */}
        <div className="relative">
          <Input
            id={id}
            ref={ref}
            type={type}
            className={cn(
              "pr-10",
              error && "border-destructive focus-visible:ring-destructive",
              className
            )}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${id}-error` : hint ? `${id}-hint` : undefined
            }
            {...props}
          />

          {/* Loading spinner during validation */}
          {isValidating && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Error message display */}
        {error && (
          <p
            id={`${id}-error`}
            className="text-sm font-medium text-destructive"
            role="alert"
          >
            {error}
          </p>
        )}

        {/* Hint text (shown when no error) */}
        {!error && hint && (
          <p
            id={`${id}-hint`}
            className="text-sm text-muted-foreground"
          >
            {hint}
          </p>
        )}
      </div>
    );
  }
);

ValidatedInput.displayName = "ValidatedInput";
