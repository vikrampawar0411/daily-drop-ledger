import { zxcvbn, zxcvbnOptions } from "@zxcvbn-ts/core";
import * as zxcvbnCommonPackage from "@zxcvbn-ts/language-common";
import * as zxcvbnEnPackage from "@zxcvbn-ts/language-en";

/**
 * Initialize zxcvbn with English language pack
 * This configuration allows the library to detect common passwords and patterns
 */
const options = {
  translations: zxcvbnEnPackage.translations,
  graphs: zxcvbnCommonPackage.adjacencyGraphs,
  dictionary: {
    ...zxcvbnCommonPackage.dictionary,
    ...zxcvbnEnPackage.dictionary,
  },
};

zxcvbnOptions.setOptions(options);

/**
 * Password strength levels with user-friendly labels
 * Based on zxcvbn scoring: 0-4 scale
 */
export enum PasswordStrength {
  VeryWeak = 0,
  Weak = 1,
  Fair = 2,
  Strong = 3,
  VeryStrong = 4,
}

/**
 * Password strength labels for display
 */
export const PASSWORD_STRENGTH_LABELS: Record<PasswordStrength, string> = {
  [PasswordStrength.VeryWeak]: "Very Weak",
  [PasswordStrength.Weak]: "Weak",
  [PasswordStrength.Fair]: "Fair",
  [PasswordStrength.Strong]: "Strong",
  [PasswordStrength.VeryStrong]: "Very Strong",
};

/**
 * Color codes for password strength visualization
 * Maps to Tailwind CSS color classes
 */
export const PASSWORD_STRENGTH_COLORS: Record<
  PasswordStrength,
  { bg: string; text: string; border: string }
> = {
  [PasswordStrength.VeryWeak]: {
    bg: "bg-red-500",
    text: "text-red-700",
    border: "border-red-500",
  },
  [PasswordStrength.Weak]: {
    bg: "bg-orange-500",
    text: "text-orange-700",
    border: "border-orange-500",
  },
  [PasswordStrength.Fair]: {
    bg: "bg-yellow-500",
    text: "text-yellow-700",
    border: "border-yellow-500",
  },
  [PasswordStrength.Strong]: {
    bg: "bg-green-500",
    text: "text-green-700",
    border: "border-green-500",
  },
  [PasswordStrength.VeryStrong]: {
    bg: "bg-emerald-500",
    text: "text-emerald-700",
    border: "border-emerald-500",
  },
};

/**
 * Password strength result interface
 */
export interface PasswordStrengthResult {
  score: PasswordStrength;
  label: string;
  colors: { bg: string; text: string; border: string };
  feedback: {
    warning: string;
    suggestions: string[];
  };
  crackTimeDisplay: string;
}

/**
 * Analyze password strength using zxcvbn library
 * Returns comprehensive strength analysis including score, feedback, and crack time
 *
 * @param password - The password to analyze
 * @param userInputs - Optional array of user-specific inputs (email, name, etc.) to check against
 * @returns PasswordStrengthResult with score, label, colors, and feedback
 */
export function analyzePasswordStrength(
  password: string,
  userInputs: string[] = []
): PasswordStrengthResult {
  // Return minimum strength for empty password
  if (!password || password.length === 0) {
    return {
      score: PasswordStrength.VeryWeak,
      label: PASSWORD_STRENGTH_LABELS[PasswordStrength.VeryWeak],
      colors: PASSWORD_STRENGTH_COLORS[PasswordStrength.VeryWeak],
      feedback: {
        warning: "Password is required",
        suggestions: [],
      },
      crackTimeDisplay: "instantly",
    };
  }

  // Analyze password with zxcvbn
  const result = zxcvbn(password, userInputs);

  const score = result.score as PasswordStrength;

  return {
    score,
    label: PASSWORD_STRENGTH_LABELS[score],
    colors: PASSWORD_STRENGTH_COLORS[score],
    feedback: {
      warning: result.feedback.warning || "",
      suggestions: result.feedback.suggestions || [],
    },
    crackTimeDisplay: result.crackTimesDisplay.offlineSlowHashing1e4PerSecond,
  };
}

/**
 * Check if password meets minimum strength requirement
 * Default minimum: Fair (score >= 2)
 *
 * @param password - The password to check
 * @param minStrength - Minimum required strength level (default: Fair)
 * @param userInputs - Optional user-specific inputs to check against
 * @returns Boolean indicating if password meets minimum strength
 */
export function isPasswordStrengthAcceptable(
  password: string,
  minStrength: PasswordStrength = PasswordStrength.Fair,
  userInputs: string[] = []
): boolean {
  const result = analyzePasswordStrength(password, userInputs);
  return result.score >= minStrength;
}
