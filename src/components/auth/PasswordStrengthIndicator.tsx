import { analyzePasswordStrength, PasswordStrength } from "@/lib/passwordStrength";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle2, Shield } from "lucide-react";

interface PasswordStrengthIndicatorProps {
  /**
   * The password to analyze
   */
  password: string;
  /**
   * Optional user inputs to check against (email, name, etc.)
   * This helps detect passwords that contain personal information
   */
  userInputs?: string[];
  /**
   * Show detailed feedback (warning and suggestions)
   * Default: true
   */
  showFeedback?: boolean;
  /**
   * Custom CSS class for styling
   */
  className?: string;
}

/**
 * PasswordStrengthIndicator Component
 * 
 * Displays real-time visual feedback for password strength using zxcvbn analysis.
 * Shows a color-coded progress bar (red → yellow → green) with strength label,
 * optional warning messages, and suggestions for improvement.
 * 
 * @example
 * ```tsx
 * <PasswordStrengthIndicator 
 *   password={password}
 *   userInputs={[email, name]}
 *   showFeedback={true}
 * />
 * ```
 */
export function PasswordStrengthIndicator({
  password,
  userInputs = [],
  showFeedback = true,
  className = "",
}: PasswordStrengthIndicatorProps) {
  // Don't show anything if password is empty
  if (!password || password.length === 0) {
    return null;
  }

  // Analyze password strength
  const analysis = analyzePasswordStrength(password, userInputs);
  
  // Calculate progress bar percentage (0-100)
  const progressValue = ((analysis.score + 1) / 5) * 100;

  // Determine icon based on strength
  const getStrengthIcon = () => {
    if (analysis.score <= PasswordStrength.Weak) {
      return <AlertCircle className="h-4 w-4" />;
    } else if (analysis.score === PasswordStrength.Fair) {
      return <Shield className="h-4 w-4" />;
    } else {
      return <CheckCircle2 className="h-4 w-4" />;
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Strength indicator bar and label */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <div className={`flex items-center gap-1.5 font-medium ${analysis.colors.text}`}>
            {getStrengthIcon()}
            <span>Password Strength: {analysis.label}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {analysis.crackTimeDisplay}
          </span>
        </div>
        
        {/* Color-coded progress bar with dynamic color */}
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className={`h-full transition-all ${analysis.colors.bg}`}
            style={{ width: `${progressValue}%` }}
          />
        </div>
      </div>

      {/* Feedback section with warnings and suggestions */}
      {showFeedback && (analysis.feedback.warning || analysis.feedback.suggestions.length > 0) && (
        <div className="rounded-lg border border-muted bg-muted/50 p-3 space-y-2">
          {/* Warning message */}
          {analysis.feedback.warning && (
            <p className="text-xs text-muted-foreground flex items-start gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              <span>{analysis.feedback.warning}</span>
            </p>
          )}
          
          {/* Improvement suggestions */}
          {analysis.feedback.suggestions.length > 0 && (
            <ul className="text-xs text-muted-foreground space-y-1 pl-5 list-disc">
              {analysis.feedback.suggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
