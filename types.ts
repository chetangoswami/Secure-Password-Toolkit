export interface PasswordOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  minUppercase: number;
  minLowercase: number;
  minNumbers: number;
  minSymbols: number;
}

export interface PassphraseOptions {
  wordCount: number;
  separator: string;
  capitalize: boolean;
  includeNumber: boolean;
}

export enum StrengthLevel {
  EMPTY,
  VERY_WEAK,
  WEAK,
  MEDIUM,
  STRONG,
}

export interface HistoryItem {
  password: string;
  timestamp: number;
  type: 'password' | 'passphrase';
  options: PasswordOptions | PassphraseOptions;
}

export interface AuditResult {
  rating: string;
  vulnerabilities: string[];
  suggestions: string[];
}