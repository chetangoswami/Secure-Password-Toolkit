
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PasswordOptions, PassphraseOptions, HistoryItem, AuditResult } from './types';
import { usePasswordGenerator } from './hooks/usePasswordGenerator';
import StrengthIndicator from './components/StrengthIndicator';
import PasswordHistory from './components/PasswordHistory';
import Tooltip from './components/Tooltip';
import { CheckIcon, CopyIcon, ArrowRightIcon, RefreshIcon, SparklesIcon, SpinnerIcon, ExportIcon, AuditIcon, EyeIcon, EyeOffIcon, ShieldIcon, WarningIcon, LightbulbIcon, BulkIcon, KeyIcon } from './components/Icons';
import { SYMBOL_CHARS } from './constants';
import { GoogleGenAI, Type } from "@google/genai";


interface RuleControlProps {
    id: string;
    label: string;
    checked: boolean;
    onCheckedChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    count: number;
    onCountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    max: number;
}

const RuleControl: React.FC<RuleControlProps> = ({ id, label, checked, onCheckedChange, count, onCountChange, max }) => (
    <div className="flex items-center py-1 sm:py-2 select-none text-slate-200 text-sm sm:text-base group">
        <label htmlFor={id} className="flex items-center cursor-pointer flex-grow">
            <div className="relative flex items-center justify-center w-6 h-6 mr-4 flex-shrink-0">
                <input
                    id={id}
                    type="checkbox"
                    checked={checked}
                    onChange={onCheckedChange}
                    className="absolute opacity-0 w-full h-full cursor-pointer peer"
                />
                <span className="w-6 h-6 bg-slate-900/50 rounded border-2 border-slate-500 peer-focus:ring-2 peer-focus:ring-offset-2 peer-focus:ring-offset-slate-800 peer-focus:ring-emerald-500 peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all duration-200 group-hover:border-slate-400"></span>
                <span className="absolute text-white opacity-0 peer-checked:opacity-100 transition-all duration-200 pointer-events-none transform scale-50 peer-checked:scale-100">
                    <CheckIcon className="stroke-current w-4 h-4" />
                </span>
            </div>
            {label}
        </label>
        {checked && (
            <div className="flex items-center gap-2 ml-4" onClick={e => e.stopPropagation()}>
                <label htmlFor={`${id}-count`} className="text-sm text-slate-400">Min:</label>
                <input
                    type="number"
                    id={`${id}-count`}
                    value={count}
                    onChange={onCountChange}
                    min="1"
                    max={max}
                    className="w-16 bg-slate-900/50 border-2 border-slate-600 rounded-md px-2 py-1 text-white text-center focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    aria-label={`Minimum ${label}`}
                />
            </div>
        )}
    </div>
);


function App() {
  const [generatorType, setGeneratorType] = useState<'password' | 'passphrase' | 'audit' | 'bulk'>(() => {
    return (localStorage.getItem('generatorType') as 'password' | 'passphrase' | 'audit' | 'bulk') || 'password';
  });

  const [passwordOptions, setPasswordOptions] = useState<PasswordOptions>(() => {
    const defaultOptions: PasswordOptions = {
        length: 16,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: false,
        minUppercase: 1,
        minLowercase: 1,
        minNumbers: 1,
        minSymbols: 0,
      };
    try {
      const savedOptions = localStorage.getItem('passwordOptions');
      if (savedOptions) {
        const parsed = JSON.parse(savedOptions);
        // Merge saved with defaults to ensure new fields from updates exist
        return { ...defaultOptions, ...parsed };
      }
    } catch (error) {
      console.error("Failed to parse options from localStorage", error);
    }
    return defaultOptions;
  });

  const [passphraseOptions, setPassphraseOptions] = useState<PassphraseOptions>(() => {
    try {
      const savedOptions = localStorage.getItem('passphraseOptions');
      if (savedOptions) {
        return JSON.parse(savedOptions);
      }
    } catch (error) {
      console.error("Failed to parse passphrase options from localStorage", error);
    }
    return {
      wordCount: 4,
      separator: '-',
      capitalize: true,
      includeNumber: false,
    };
  });

  const [isCopied, setIsCopied] = useState(false);
  const { password, strength, generatePassword, generatePassphrase, setPassword, updateStrength } = usePasswordGenerator();
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const savedHistory = localStorage.getItem('passwordHistory');
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        // Migration: If history items lack the new 'type' field, clear them to prevent errors.
        if (parsedHistory.length > 0 && !parsedHistory[0].type) {
            console.warn('Old password history format detected. Clearing history for compatibility.');
            return [];
        }
        return parsedHistory;
      }
      return [];
    } catch (error) {
      console.error("Failed to parse history from localStorage", error);
      return [];
    }
  });

  // AI Generation State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  
  // AI Audit State
  const [auditPassword, setAuditPassword] = useState('');
  const [isAuditPasswordVisible, setIsAuditPasswordVisible] = useState(false);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditError, setAuditError] = useState('');
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false);
  const [suggestionError, setSuggestionError] = useState('');
  
  // Bulk Generation State
  const [bulkGenType, setBulkGenType] = useState<'password' | 'passphrase'>('password');
  const [bulkCount, setBulkCount] = useState(10);
  const [bulkResults, setBulkResults] = useState<string[]>([]);


  useEffect(() => {
    localStorage.setItem('passwordHistory', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('passwordOptions', JSON.stringify(passwordOptions));
  }, [passwordOptions]);

  useEffect(() => {
    localStorage.setItem('passphraseOptions', JSON.stringify(passphraseOptions));
  }, [passphraseOptions]);

  useEffect(() => {
    localStorage.setItem('generatorType', generatorType);
  }, [generatorType]);
  
  const addNewPasswordToHistory = (newPassword: string, type: 'password' | 'passphrase', options: PasswordOptions | PassphraseOptions) => {
    if (!newPassword) return;
    const newHistoryItem: HistoryItem = { 
        password: newPassword, 
        timestamp: Date.now(),
        type,
        options,
    };
    setHistory(prev => [newHistoryItem, ...prev.filter(p => p.password !== newPassword)].slice(0, 10));
  };
  
  const handleGenerate = useCallback(() => {
    if (generatorType === 'audit' || generatorType === 'bulk') return;
    
    let newPassword = '';
    let currentOptions: PasswordOptions | PassphraseOptions;

    if (generatorType === 'password') {
      currentOptions = passwordOptions;
      newPassword = generatePassword(passwordOptions);
    } else {
      currentOptions = passphraseOptions;
      newPassword = generatePassphrase(passphraseOptions);
    }

    if (newPassword) {
      setPassword(newPassword);
      updateStrength(generatorType, currentOptions, newPassword);
      addNewPasswordToHistory(newPassword, generatorType, currentOptions);
    }
  }, [generatorType, passwordOptions, passphraseOptions, generatePassword, generatePassphrase, setPassword, updateStrength]);
  
  const handleAiGenerate = async () => {
    if (generatorType === 'audit' || generatorType === 'bulk') return;

    if (generatorType === 'passphrase' && !aiPrompt.trim()) {
      setAiError('Please enter a theme for the AI.');
      return;
    }
    setIsAiLoading(true);
    setAiError('');
  
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      
      let prompt = '';
      let responseSchema: any;
      let resultKey = '';
  
      if (generatorType === 'password') {
        resultKey = 'password';
        const rules = [
          `- Must be exactly ${passwordOptions.length} characters long.`,
          passwordOptions.includeUppercase ? `- Must include at least ${passwordOptions.minUppercase} uppercase letter(s) (A-Z).` : "- Must NOT include uppercase letters.",
          passwordOptions.includeLowercase ? `- Must include at least ${passwordOptions.minLowercase} lowercase letter(s) (a-z).` : "- Must NOT include lowercase letters.",
          passwordOptions.includeNumbers ? `- Must include at least ${passwordOptions.minNumbers} number(s) (0-9).` : "- Must NOT include numbers.",
          passwordOptions.includeSymbols ? `- Must include at least ${passwordOptions.minSymbols} symbol(s) from the set '${SYMBOL_CHARS}'.` : "- Must NOT include symbols.",
        ];

        prompt = `
          Generate a single, secure, random password.
          The password must strictly adhere to all of the following rules:
          ${rules.join('\n')}
          The final password should be completely random-looking and not contain dictionary words.
        `;
        responseSchema = {
          type: Type.OBJECT,
          properties: {
            [resultKey]: {
              type: Type.STRING,
              description: 'The generated password string.'
            }
          },
          required: [resultKey],
        };
      } else { // passphrase
        resultKey = 'passphrase';
        const capitalizeInstruction = passphraseOptions.capitalize ? "Capitalize the first letter of each word." : "Use lowercase for all words.";
        const numberInstruction = passphraseOptions.includeNumber ? `Include one random number between 0 and 99 somewhere in the passphrase.` : "Do not include any numbers.";
        
        prompt = `
          Generate a memorable passphrase based on the following criteria:
          - Theme: "${aiPrompt}"
          - Number of words: ${passphraseOptions.wordCount}
          - Separator: "${passphraseOptions.separator}"
          - ${capitalizeInstruction}
          - ${numberInstruction}
          The passphrase should be creative, unique, and relevant to the theme.
        `;
        responseSchema = {
          type: Type.OBJECT,
          properties: {
            [resultKey]: {
              type: Type.STRING,
              description: 'The generated passphrase string.'
            }
          },
          required: [resultKey],
        };
      }
  
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema,
        }
      });
  
      const jsonText = response.text.trim();
      const result = JSON.parse(jsonText);
      const newPassword = result[resultKey];
      const currentOptions = generatorType === 'password' ? passwordOptions : passphraseOptions;
      
      if (newPassword) {
        setPassword(newPassword);
        updateStrength(generatorType, currentOptions, newPassword);
        addNewPasswordToHistory(newPassword, generatorType, currentOptions);
      } else {
        throw new Error(`AI did not return a valid ${resultKey}.`);
      }
  
    } catch (error) {
      console.error("AI Generation Error:", error);
      setAiError("Sorry, couldn't generate. Please try again.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAuditPassword = async () => {
    if (!auditPassword.trim()) {
        setAuditError('Please enter a password to audit.');
        return;
    }
    setIsAuditing(true);
    setAuditError('');
    setSuggestionError('');
    setAuditResult(null);

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

        const prompt = `
            You are a cybersecurity expert specializing in password entropy and cracking techniques.
            Analyze the following password with extreme scrutiny: "${auditPassword}"

            Your analysis must be returned as a JSON object adhering to the specified schema.
            Focus on the following attack vectors:

            1.  **Brute-Force Resistance:** Based on the password's length and character complexity (the number of possible characters per position), estimate how long it would take a standard consumer GPU to crack it. Mention this in the vulnerabilities. A strong password should take centuries.
            2.  **Rainbow Table / Dictionary Attacks:** Is the password, or parts of it, a common word, name, phrase, or something found in password-breach databases (e.g., 'password123', 'dragon', 'liverpool')? Common passwords are instantly defeated by rainbow tables.
            3.  **Predictable Patterns & Substitutions:** Identify simplistic patterns like keyboard sequences (e.g., 'qwerty', 'asdfg'), character repetitions (e.g., 'aaa111'), number sequences (e.g., '12345'), and common "leetspeak" substitutions (e.g., 'a' for '@', 'o' for '0'). These patterns are easily exploited by cracking software.
            4.  **Social Engineering Risk:** Does the password contain elements that could be easily guessed personal information (names, birthdates, pet names)? Even if you don't know the user, flag dictionary words that could represent this risk.

            Based on this deep analysis, provide a concise overall rating, a list of the specific vulnerabilities you discovered, and actionable suggestions for improvement.
            
            IMPORTANT: Do NOT suggest a new, specific password. Instead, provide expert guidance on HOW to construct a better password (e.g., "Replace the dictionary word 'dragon' with a random, non-dictionary word", "Increase length to at least 16 characters to make brute-force attacks infeasible").
        `;

        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                rating: {
                    type: Type.STRING,
                    description: 'A single-word rating: "Very Weak", "Weak", "Moderate", "Strong", or "Very Strong".'
                },
                vulnerabilities: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'A list of specific weaknesses found in the password, considering brute-force, dictionary attacks, and patterns.'
                },
                suggestions: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'A list of actionable, expert suggestions to mitigate the identified vulnerabilities.'
                }
            },
            required: ['rating', 'vulnerabilities', 'suggestions'],
        };
        
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema,
          }
        });
  
        const jsonText = response.text.trim();
        const result: AuditResult = JSON.parse(jsonText);

        if (result && result.rating) {
            setAuditResult(result);
        } else {
            throw new Error("AI returned an invalid audit format.");
        }

    } catch (error) {
        console.error("AI Audit Error:", error);
        setAuditError("Sorry, the audit failed. Please try again.");
    } finally {
        setIsAuditing(false);
    }
  };
  
  const handleGenerateWithSuggestions = async () => {
    if (!auditResult || !auditPassword) return;

    setIsGeneratingSuggestion(true);
    setSuggestionError('');

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        
        const characterTypes = [];
        if (/[A-Z]/.test(auditPassword)) characterTypes.push("uppercase letters (A-Z)");
        if (/[a-z]/.test(auditPassword)) characterTypes.push("lowercase letters (a-z)");
        if (/[0-9]/.test(auditPassword)) characterTypes.push("numbers (0-9)");
        if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(auditPassword)) characterTypes.push(`symbols (e.g., ${SYMBOL_CHARS.slice(0, 10)}...)`);

        const prompt = `
            You are a password security expert. Your task is to transform a weak password into a significantly stronger one based on a list of suggestions.

            Original Password: "${auditPassword}"
            
            Security Suggestions to apply:
            - ${auditResult.suggestions.join('\n- ')}

            Transformation Rules:
            1. The new password MUST be exactly ${auditPassword.length} characters long.
            2. The new password MUST include the same character types as the original: ${characterTypes.join(', ')}. If the original has none, please add variety.
            3. Directly apply the suggestions. For example, if a suggestion is "Replace 'a' with '@'", make that change. If it's "add a number", add one.
            4. The final result should be a single, secure password that is not easily guessable. Do not include any explanations, just the password.
        `;

        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                newPassword: {
                    type: Type.STRING,
                    description: 'The new, improved password.'
                }
            },
            required: ['newPassword'],
        };

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema,
          }
        });

        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        const newPassword = result.newPassword;

        if (newPassword) {
            const newPasswordOptions: PasswordOptions = { 
              length: newPassword.length,
              includeLowercase: /[a-z]/.test(newPassword),
              includeUppercase: /[A-Z]/.test(newPassword),
              includeNumbers: /[0-9]/.test(newPassword),
              includeSymbols: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(newPassword),
              minLowercase: (newPassword.match(/[a-z]/g) || []).length,
              minUppercase: (newPassword.match(/[A-Z]/g) || []).length,
              minNumbers: (newPassword.match(/[0-9]/g) || []).length,
              minSymbols: (newPassword.match(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/g) || []).length,
            };

            setPassword(newPassword);
            setGeneratorType('password');
            setPasswordOptions(newPasswordOptions);
            updateStrength('password', newPasswordOptions, newPassword);
            addNewPasswordToHistory(newPassword, 'password', newPasswordOptions);
            setAuditResult(null);
            setAuditPassword('');
        } else {
            throw new Error("AI did not return a new password.");
        }

    } catch (error) {
        console.error("AI Suggestion Generation Error:", error);
        setSuggestionError("Failed to generate a new password. Please try again.");
    } finally {
        setIsGeneratingSuggestion(false);
    }
  };

  const handleSetGeneratorType = useCallback((type: 'password' | 'passphrase' | 'audit' | 'bulk') => {
    setGeneratorType(type);
    setAiError('');
    setAiPrompt('');
    setAuditError('');
    setSuggestionError('');
    setAuditResult(null);
    setAuditPassword('');
    
    if (type === 'audit' || type === 'bulk') {
        setPassword('');
        updateStrength('password', passwordOptions, ''); // Reset strength meter
    } else {
        const currentOptions = type === 'password' ? passwordOptions : passphraseOptions;
        updateStrength(type, currentOptions);
        if(history.length > 0) {
            const latestRelevantItem = history.find(item => item.type === type) || history[0];
            setPassword(latestRelevantItem.password);
        }
    }
     if (type !== 'bulk') {
        setBulkResults([]); // Clear bulk results when leaving tab
    }
  }, [history, passwordOptions, passphraseOptions, updateStrength, setPassword]);


  useEffect(() => {
    if (history.length > 0 && generatorType !== 'audit' && generatorType !== 'bulk') {
      const latestItem = history[0];
      setPassword(latestItem.password);
      setGeneratorType(latestItem.type);
      if (latestItem.type === 'password') {
        setPasswordOptions(latestItem.options as PasswordOptions);
      } else {
        setPassphraseOptions(latestItem.options as PassphraseOptions);
      }
      updateStrength(latestItem.type, latestItem.options, latestItem.password);
    } else {
      if (generatorType !== 'audit' && generatorType !== 'bulk') {
        const currentOptions = generatorType === 'password' ? passwordOptions : passphraseOptions;
        updateStrength(generatorType, currentOptions);
      } else {
        updateStrength('password', passwordOptions, '');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopyToClipboard = useCallback(async (textToCopy: string) => {
    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.warn('Could not copy text with clipboard API:', err);
      // Fallback for non-focused documents or older browsers
      const textArea = document.createElement("textarea");
      textArea.value = textToCopy;
      
      // Make the textarea invisible and out of the way
      textArea.style.position = 'fixed';
      textArea.style.top = '-9999px';
      textArea.style.left = '-9999px';

      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        if (successful) {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } else {
            console.error('Fallback copy command failed');
        }
      } catch (err) {
        console.error('Fallback copy error:', err);
      }
      
      document.body.removeChild(textArea);
    }
  }, []);
  
  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        const isModifierPressed = e.ctrlKey || e.metaKey;
        if (!isModifierPressed) return;

        let handled = false;
        switch (e.key.toLowerCase()) {
            case 'g':
                if (generatorType !== 'audit' && generatorType !== 'bulk') {
                    handleGenerate();
                    handled = true;
                }
                break;
            case 'c':
                if (password) {
                    handleCopyToClipboard(password);
                    handled = true;
                }
                break;
            case '1':
                handleSetGeneratorType('password');
                handled = true;
                break;
            case '2':
                handleSetGeneratorType('passphrase');
                handled = true;
                break;
            case '3':
                handleSetGeneratorType('audit');
                handled = true;
                break;
             case '4':
                handleSetGeneratorType('bulk');
                handled = true;
                break;
        }

        if (handled) {
            e.preventDefault();
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
}, [generatorType, password, handleGenerate, handleCopyToClipboard, handleSetGeneratorType]);

  const handlePasswordOptionsChange = useCallback((updates: Partial<PasswordOptions>) => {
    setPasswordOptions(prev => {
        const newOptions = { ...prev, ...updates };

        // Sync checkboxes with min counts
        if (updates.hasOwnProperty('minUppercase')) {
            const count = Math.max(0, Number(updates.minUppercase) || 0);
            newOptions.minUppercase = count;
            newOptions.includeUppercase = count > 0;
        }
        if (updates.hasOwnProperty('minLowercase')) {
            const count = Math.max(0, Number(updates.minLowercase) || 0);
            newOptions.minLowercase = count;
            newOptions.includeLowercase = count > 0;
        }
        if (updates.hasOwnProperty('minNumbers')) {
            const count = Math.max(0, Number(updates.minNumbers) || 0);
            newOptions.minNumbers = count;
            newOptions.includeNumbers = count > 0;
        }
        if (updates.hasOwnProperty('minSymbols')) {
            const count = Math.max(0, Number(updates.minSymbols) || 0);
            newOptions.minSymbols = count;
            newOptions.includeSymbols = count > 0;
        }

        // Sync min counts with checkboxes
        if (updates.hasOwnProperty('includeUppercase')) {
            newOptions.minUppercase = updates.includeUppercase ? Math.max(1, prev.minUppercase) : 0;
        }
        if (updates.hasOwnProperty('includeLowercase')) {
            newOptions.minLowercase = updates.includeLowercase ? Math.max(1, prev.minLowercase) : 0;
        }
        if (updates.hasOwnProperty('includeNumbers')) {
            newOptions.minNumbers = updates.includeNumbers ? Math.max(1, prev.minNumbers) : 0;
        }
        if (updates.hasOwnProperty('includeSymbols')) {
            newOptions.minSymbols = updates.includeSymbols ? Math.max(1, prev.minSymbols) : 0;
        }
        
        return newOptions;
    });
  }, []);
  
  const totalMinimums = useMemo(() => {
    return (passwordOptions.minUppercase || 0) + 
           (passwordOptions.minLowercase || 0) + 
           (passwordOptions.minNumbers || 0) + 
           (passwordOptions.minSymbols || 0);
  }, [passwordOptions]);

  useEffect(() => {
    if (passwordOptions.length < totalMinimums) {
        handlePasswordOptionsChange({ length: totalMinimums });
    }
  }, [passwordOptions.length, totalMinimums, handlePasswordOptionsChange]);

  useEffect(() => {
    updateStrength('password', passwordOptions);
  }, [passwordOptions, updateStrength]);

  const handlePassphraseOptionsChange = (option: Partial<PassphraseOptions>) => {
    const newOptions = { ...passphraseOptions, ...option };
    setPassphraseOptions(newOptions);
    updateStrength('passphrase', newOptions);
  };
  
  const handleAuditPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setAuditPassword(value);
      const tempOptions: PasswordOptions = { 
          length: value.length,
          includeLowercase: /[a-z]/.test(value),
          includeUppercase: /[A-Z]/.test(value),
          includeNumbers: /[0-9]/.test(value),
          includeSymbols: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(value),
          minLowercase: 0,
          minUppercase: 0,
          minNumbers: 0,
          minSymbols: 0,
      };
      updateStrength('password', tempOptions, value);
  };

  const handleSelectFromHistory = useCallback((item: HistoryItem) => {
    handleSetGeneratorType(item.type);
    setPassword(item.password);
    if (item.type === 'password') {
        setPasswordOptions(item.options as PasswordOptions);
    } else {
        setPassphraseOptions(item.options as PassphraseOptions);
    }
    updateStrength(item.type, item.options, item.password);
    handleCopyToClipboard(item.password);
  }, [updateStrength, handleSetGeneratorType, handleCopyToClipboard]);
  
  const handleClearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const handleDeleteItemFromHistory = useCallback((timestamp: number) => {
    setHistory(prev => prev.filter(item => item.timestamp !== timestamp));
  }, []);

  const handleExportHistory = useCallback(() => {
    if (history.length === 0) return;

    const formattedHistory = history
      .map(item => `${new Date(item.timestamp).toLocaleString()} - ${item.password}`)
      .join('\n');

    const blob = new Blob([formattedHistory], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'password_history.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  }, [history]);

  const handleBulkGenerate = useCallback(() => {
    const results: string[] = [];
    for (let i = 0; i < bulkCount; i++) {
        if (bulkGenType === 'password') {
            results.push(generatePassword(passwordOptions));
        } else {
            results.push(generatePassphrase(passphraseOptions));
        }
    }
    setBulkResults(results);
    handleCopyToClipboard(results.join('\n'));
  }, [bulkCount, bulkGenType, passwordOptions, passphraseOptions, generatePassword, generatePassphrase, handleCopyToClipboard]);

  const handleExportBulk = useCallback(() => {
    if (bulkResults.length === 0) return;
    const text = bulkResults.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bulk_${bulkGenType}s.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [bulkResults, bulkGenType]);

  const auditResultColor = {
    "Very Weak": "text-red-500",
    "Weak": "text-orange-500",
    "Moderate": "text-yellow-500",
    "Strong": "text-emerald-400",
    "Very Strong": "text-green-500",
  }[auditResult?.rating || ''] || 'text-white';
  
  const PasswordOptionsPanel = () => (
    <>
      <div className="mb-4 sm:mb-6">
        <div className="flex justify-between items-center mb-2 sm:mb-4">
          <label htmlFor="length" className="text-slate-200 text-sm sm:text-lg">Character Length</label>
          <span className="text-emerald-400 text-2xl sm:text-3xl font-bold">{passwordOptions.length}</span>
        </div>
        <Tooltip text="Drag to change password length (6-32)">
            <input
              type="range"
              id="length"
              min={Math.max(6, totalMinimums)}
              max="32"
              value={passwordOptions.length}
              onChange={(e) => handlePasswordOptionsChange({ length: Number(e.target.value) })}
              className="w-full h-2 bg-slate-900/50 rounded-lg appearance-none cursor-pointer range-thumb"
            />
        </Tooltip>
      </div>
      <div className="space-y-2">
         <RuleControl
            id="uppercase"
            label="Include Uppercase Letters (A-Z)"
            checked={passwordOptions.includeUppercase}
            onCheckedChange={(e) => handlePasswordOptionsChange({ includeUppercase: e.target.checked })}
            count={passwordOptions.minUppercase}
            onCountChange={(e) => handlePasswordOptionsChange({ minUppercase: Number(e.target.value) })}
            max={passwordOptions.length - (totalMinimums - passwordOptions.minUppercase)}
         />
         <RuleControl
            id="lowercase"
            label="Include Lowercase Letters (a-z)"
            checked={passwordOptions.includeLowercase}
            onCheckedChange={(e) => handlePasswordOptionsChange({ includeLowercase: e.target.checked })}
            count={passwordOptions.minLowercase}
            onCountChange={(e) => handlePasswordOptionsChange({ minLowercase: Number(e.target.value) })}
            max={passwordOptions.length - (totalMinimums - passwordOptions.minLowercase)}
         />
          <RuleControl
            id="numbers"
            label="Include Numbers (0-9)"
            checked={passwordOptions.includeNumbers}
            onCheckedChange={(e) => handlePasswordOptionsChange({ includeNumbers: e.target.checked })}
            count={passwordOptions.minNumbers}
            onCountChange={(e) => handlePasswordOptionsChange({ minNumbers: Number(e.target.value) })}
            max={passwordOptions.length - (totalMinimums - passwordOptions.minNumbers)}
         />
         <RuleControl
            id="symbols"
            label={`Include Symbols (${SYMBOL_CHARS.slice(0,10)}...)`}
            checked={passwordOptions.includeSymbols}
            onCheckedChange={(e) => handlePasswordOptionsChange({ includeSymbols: e.target.checked })}
            count={passwordOptions.minSymbols}
            onCountChange={(e) => handlePasswordOptionsChange({ minSymbols: Number(e.target.value) })}
            max={passwordOptions.length - (totalMinimums - passwordOptions.minSymbols)}
         />
      </div>
    </>
  );

  const PassphraseOptionsPanel = () => (
      <>
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <label htmlFor="wordCount" className="text-slate-200 text-lg">Number of Words</label>
              <span className="text-emerald-400 text-3xl font-bold">{passphraseOptions.wordCount}</span>
            </div>
            <Tooltip text="Drag to change word count (3-8)">
                <input
                  type="range"
                  id="wordCount"
                  min="3"
                  max="8"
                  value={passphraseOptions.wordCount}
                  onChange={(e) => handlePassphraseOptionsChange({ wordCount: Number(e.target.value) })}
                  className="w-full h-2 bg-slate-900/50 rounded-lg appearance-none cursor-pointer range-thumb"
                />
            </Tooltip>
          </div>
          <div className="mb-6">
              <label htmlFor="separator" className="text-slate-200 text-lg mb-2 block">Separator Character</label>
              <input
                  type="text"
                  id="separator"
                  value={passphraseOptions.separator}
                  onChange={(e) => handlePassphraseOptionsChange({ separator: e.target.value.slice(0, 1) })}
                  maxLength={1}
                  className="w-full bg-slate-900/50 border-2 border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
          </div>
          <div className="space-y-2">
             <label htmlFor="capitalize" className="flex items-center py-2 cursor-pointer select-none text-slate-200 text-base sm:text-lg group">
                <div className="relative flex items-center justify-center w-6 h-6 mr-4 flex-shrink-0">
                    <input
                        id="capitalize"
                        type="checkbox"
                        checked={passphraseOptions.capitalize}
                        onChange={(e) => handlePassphraseOptionsChange({ capitalize: e.target.checked })}
                        className="absolute opacity-0 w-full h-full cursor-pointer peer"
                    />
                    <span className="w-6 h-6 bg-slate-900/50 rounded border-2 border-slate-500 peer-focus:ring-2 peer-focus:ring-offset-2 peer-focus:ring-offset-slate-800 peer-focus:ring-emerald-500 peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all duration-200 group-hover:border-slate-400"></span>
                    <span className="absolute text-white opacity-0 peer-checked:opacity-100 transition-all duration-200 pointer-events-none transform scale-50 peer-checked:scale-100">
                        <CheckIcon className="stroke-current w-4 h-4" />
                    </span>
                </div>
                Capitalize First Letter of Each Word
            </label>
             <label htmlFor="includeNumber" className="flex items-center py-2 cursor-pointer select-none text-slate-200 text-base sm:text-lg group">
                <div className="relative flex items-center justify-center w-6 h-6 mr-4 flex-shrink-0">
                    <input
                        id="includeNumber"
                        type="checkbox"
                        checked={passphraseOptions.includeNumber}
                        onChange={(e) => handlePassphraseOptionsChange({ includeNumber: e.target.checked })}
                        className="absolute opacity-0 w-full h-full cursor-pointer peer"
                    />
                    <span className="w-6 h-6 bg-slate-900/50 rounded border-2 border-slate-500 peer-focus:ring-2 peer-focus:ring-offset-2 peer-focus:ring-offset-slate-800 peer-focus:ring-emerald-500 peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all duration-200 group-hover:border-slate-400"></span>
                    <span className="absolute text-white opacity-0 peer-checked:opacity-100 transition-all duration-200 pointer-events-none transform scale-50 peer-checked:scale-100">
                        <CheckIcon className="stroke-current w-4 h-4" />
                    </span>
                </div>
               Include a Random Number
            </label>
          </div>
      </>
  );


  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-2 sm:p-4 font-mono">
      <div className="w-full max-w-lg mx-auto flex flex-col h-full">
        <h1 className="text-slate-300 text-center text-lg sm:text-2xl font-bold mb-3 sm:mb-6 tracking-widest flex items-center justify-center gap-2 sm:gap-4 flex-shrink-0">
          <KeyIcon />
          PASSWORD TOOLKIT
        </h1>
        
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden max-h-[calc(100vh-8rem)]">
            {/* Password Display */}
            <div className="p-4 sm:p-6 flex justify-between items-center flex-shrink-0">
              <span className={`text-slate-100 text-2xl sm:text-4xl font-bold tracking-wider break-all flex-1 pr-4 transition-opacity ${password ? 'opacity-100 password-glow' : 'opacity-50'}`}>
                {password || (generatorType === 'bulk' ? 'Bulk Mode' : 'P4$5W0rD!')}
              </span>
              <div className="flex items-center gap-3">
                <Tooltip text={`Generate new ${generatorType} (Ctrl+G)`} align="right">
                    <button onClick={handleGenerate} aria-label="Regenerate password" disabled={generatorType === 'audit' || generatorType === 'bulk'} className="transition-transform active:scale-90">
                        <RefreshIcon className={`text-emerald-400 hover:text-white transition-colors w-7 h-7 hover:rotate-180 duration-500 ${(generatorType === 'audit' || generatorType === 'bulk') ? 'opacity-30 cursor-not-allowed' : ''}`} />
                    </button>
                </Tooltip>
                <Tooltip text={isCopied ? 'Copied!' : 'Copy to clipboard (Ctrl+C)'} align="right">
                  <button onClick={() => handleCopyToClipboard(password)} aria-label="Copy password" disabled={!password} className="transition-transform active:scale-90">
                      {isCopied ? <CheckIcon className="text-emerald-400 w-7 h-7" /> : <CopyIcon className="text-emerald-400 hover:text-white transition-colors w-7 h-7" />}
                  </button>
                </Tooltip>
              </div>
            </div>

            {/* Customization Panel */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="p-4 sm:p-6 border-t border-slate-700/50">
                {/* Tabs */}
                <div className="flex border-b border-slate-700 mb-4 sm:mb-6 bg-slate-800/50 rounded-t-lg p-1 text-sm sm:text-base">
                    <button 
                        onClick={() => handleSetGeneratorType('password')}
                        className={`flex-1 py-2 text-center font-bold transition-all duration-300 rounded-md ${generatorType === 'password' ? 'text-emerald-400 bg-slate-700/50' : 'text-slate-400 hover:text-white'}`}
                    >
                        Password
                    </button>
                    <button 
                        onClick={() => handleSetGeneratorType('passphrase')}
                        className={`flex-1 py-2 text-center font-bold transition-all duration-300 rounded-md ${generatorType === 'passphrase' ? 'text-emerald-400 bg-slate-700/50' : 'text-slate-400 hover:text-white'}`}
                    >
                        Passphrase
                    </button>
                     <button 
                        onClick={() => handleSetGeneratorType('audit')}
                        className={`flex-1 py-2 text-center font-bold transition-all duration-300 rounded-md ${generatorType === 'audit' ? 'text-emerald-400 bg-slate-700/50' : 'text-slate-400 hover:text-white'}`}
                    >
                        Audit
                    </button>
                    <button 
                        onClick={() => handleSetGeneratorType('bulk')}
                        className={`flex-1 py-2 text-center font-bold transition-all duration-300 rounded-md ${generatorType === 'bulk' ? 'text-emerald-400 bg-slate-700/50' : 'text-slate-400 hover:text-white'}`}
                    >
                        Bulk
                    </button>
                </div>
                
                {generatorType === 'password' && (
                  <div className="animate-fade-in">
                    <PasswordOptionsPanel />
                  </div>
                )}
                
                {generatorType === 'passphrase' && (
                  <div className="animate-fade-in">
                    <PassphraseOptionsPanel />
                  </div>
                )}

                {generatorType === 'audit' && (
                    <div className="animate-fade-in">
                        <p className="text-slate-400 text-sm mb-4 text-center">
                            Get an AI-powered security analysis of any password.
                        </p>
                        <div className="relative mb-4">
                            <input
                                type={isAuditPasswordVisible ? 'text' : 'password'}
                                id="audit-password"
                                value={auditPassword}
                                onChange={handleAuditPasswordChange}
                                placeholder="Enter password to audit..."
                                className="w-full bg-slate-900/50 border-2 border-slate-600 rounded-lg pl-4 pr-12 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                            />
                            <button
                                onClick={() => setIsAuditPasswordVisible(prev => !prev)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                aria-label={isAuditPasswordVisible ? 'Hide password' : 'Show password'}
                            >
                                {isAuditPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
                            </button>
                        </div>

                        {/* Audit Results Section */}
                        {isAuditing && <div className="flex justify-center items-center py-8"><SpinnerIcon className="animate-spin w-8 h-8 text-emerald-400" /></div>}
                        {auditError && <p className="text-red-400 text-center py-4">{auditError}</p>}
                        
                        {auditResult && (
                            <div className="mt-6 space-y-6 animate-fade-in">
                                <div>
                                    <h4 className="flex items-center gap-3 text-lg font-bold text-slate-300 mb-2"><ShieldIcon /> Rating</h4>
                                    <p className={`text-2xl font-bold ${auditResultColor}`}>{auditResult.rating}</p>
                                </div>
                                {auditResult.vulnerabilities.length > 0 && (
                                    <div>
                                        <h4 className="flex items-center gap-3 text-lg font-bold text-slate-300 mb-2"><WarningIcon /> Vulnerabilities</h4>
                                        <ul className="list-disc list-inside space-y-1 text-slate-300">
                                            {auditResult.vulnerabilities.map((vuln, i) => <li key={i}>{vuln}</li>)}
                                        </ul>
                                    </div>
                                )}
                                {auditResult.suggestions.length > 0 && (
                                    <div>
                                        <h4 className="flex items-center gap-3 text-lg font-bold text-slate-300 mb-2"><LightbulbIcon /> Suggestions</h4>
                                        <ul className="list-disc list-inside space-y-1 text-slate-300">
                                            {auditResult.suggestions.map((sugg, i) => <li key={i}>{sugg}</li>)}
                                        </ul>
                                    </div>
                                )}
                                <div className="mt-8 pt-6 border-t border-slate-700/50">
                                    <Tooltip text="Let AI fix this password based on the suggestions">
                                        <button
                                            onClick={handleGenerateWithSuggestions}
                                            disabled={isGeneratingSuggestion || isAuditing}
                                            className="w-full bg-emerald-500/20 text-emerald-400 px-4 py-3 rounded-lg border-2 border-emerald-500/30 hover:bg-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3 font-bold active:scale-95"
                                        >
                                            {isGeneratingSuggestion ? <SpinnerIcon /> : <SparklesIcon />}
                                            Generate with Suggestions
                                        </button>
                                    </Tooltip>
                                    {suggestionError && <p className="text-red-400 text-sm mt-2 text-center">{suggestionError}</p>}
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                {generatorType === 'bulk' && (
                    <div className="animate-fade-in">
                        <div className="flex border-b border-slate-700 mb-6">
                            <button 
                                onClick={() => setBulkGenType('password')}
                                className={`flex-1 py-2 text-center font-bold transition-all duration-300 border-b-2 ${bulkGenType === 'password' ? 'text-emerald-400 border-emerald-400' : 'text-slate-400 hover:text-white border-transparent'}`}
                            >
                                Password
                            </button>
                            <button 
                                onClick={() => setBulkGenType('passphrase')}
                                className={`flex-1 py-2 text-center font-bold transition-all duration-300 border-b-2 ${bulkGenType === 'passphrase' ? 'text-emerald-400 border-emerald-400' : 'text-slate-400 hover:text-white border-transparent'}`}
                            >
                                Passphrase
                            </button>
                        </div>
                        <div className="mb-6">
                          <div className="flex justify-between items-center mb-4">
                            <label htmlFor="bulkCount" className="text-slate-200 text-lg">Quantity</label>
                            <span className="text-emerald-400 text-3xl font-bold">{bulkCount}</span>
                          </div>
                          <Tooltip text="Drag to change quantity (1-50)">
                              <input
                                type="range"
                                id="bulkCount"
                                min="1"
                                max="50"
                                value={bulkCount}
                                onChange={(e) => setBulkCount(Number(e.target.value))}
                                className="w-full h-2 bg-slate-900/50 rounded-lg appearance-none cursor-pointer range-thumb"
                              />
                          </Tooltip>
                        </div>

                        {bulkGenType === 'password' ? <PasswordOptionsPanel/> : <PassphraseOptionsPanel/>}

                        {bulkResults.length > 0 && (
                            <div className="mt-8 pt-6 border-t border-slate-700/50 animate-fade-in">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-slate-200 text-lg font-bold">Generated Results</h3>
                                    <div className="flex items-center gap-4">
                                        <Tooltip text="Copy all results to clipboard">
                                            <button onClick={() => handleCopyToClipboard(bulkResults.join('\n'))} className="group"><CopyIcon className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition-colors"/></button>
                                        </Tooltip>
                                        <Tooltip text="Export results as .txt">
                                            <button onClick={handleExportBulk} className="group"><ExportIcon /></button>
                                        </Tooltip>
                                    </div>
                                </div>
                                <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar bg-slate-900/50 rounded-lg p-2 space-y-2">
                                    {bulkResults.map((res, i) => (
                                        <div key={i} className="flex items-center justify-between bg-slate-800/50 p-2 rounded group">
                                            <span className="text-slate-300 break-all font-sans pr-2">{res}</span>
                                            <Tooltip text="Copy" align="right">
                                              <button onClick={() => handleCopyToClipboard(res)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                  <CopyIcon className="w-5 h-5 text-emerald-500/70 hover:text-white" />
                                              </button>
                                            </Tooltip>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                { generatorType !== 'audit' && generatorType !== 'bulk' && (
                    <div className="mt-4 sm:mt-6 pt-4 border-t border-slate-700/50">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-slate-200 text-sm sm:text-lg">Generate with AI</h3>
                            <SparklesIcon/>
                        </div>
                        
                        {generatorType === 'password' ? (
                            <>
                                <p className="text-slate-400 text-sm mb-4">
                                    Let AI create a strong, random password based on your selected options.
                                </p>
                                <Tooltip text="Generate a secure password using AI">
                                    <button
                                        onClick={handleAiGenerate}
                                        disabled={isAiLoading}
                                        className="w-full bg-emerald-500/20 text-emerald-400 px-4 py-3 rounded-lg border-2 border-emerald-500/30 hover:bg-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3 font-bold active:scale-95"
                                        aria-label="Generate AI Password"
                                    >
                                        {isAiLoading ? <SpinnerIcon /> : 'Generate with AI'}
                                    </button>
                                </Tooltip>
                            </>
                        ) : (
                            <>
                                <p className="text-slate-400 text-sm mb-4">
                                    Describe a theme (e.g., "space exploration"). The settings above will be applied.
                                </p>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        id="ai-prompt"
                                        value={aiPrompt}
                                        onChange={(e) => setAiPrompt(e.target.value)}
                                        placeholder="Enter a theme..."
                                        className="flex-grow bg-slate-900/50 border-2 border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                                    />
                                    <Tooltip text="Generate using AI">
                                        <button
                                            onClick={handleAiGenerate}
                                            disabled={isAiLoading}
                                            className="bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-lg border-2 border-emerald-500/30 hover:bg-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center w-16 active:scale-95"
                                            aria-label="Generate AI"
                                        >
                                            {isAiLoading ? <SpinnerIcon /> : <ArrowRightIcon />}
                                        </button>
                                    </Tooltip>
                                </div>
                            </>
                        )}
                        {aiError && <p className="text-red-400 text-sm mt-2">{aiError}</p>}
                    </div>
                )}

                <style>{`
                    .password-glow {
                        text-shadow: 0 0 8px rgba(52, 211, 153, 0.7);
                    }
                    .range-thumb::-webkit-slider-thumb {
                        -webkit-appearance: none;
                        appearance: none;
                        width: 28px;
                        height: 28px;
                        border-radius: 50%;
                        background: #f0f0f0;
                        cursor: pointer;
                        border: none;
                        box-shadow: 0 0 10px rgba(52, 211, 153, 0.8), 0 0 5px rgba(52, 211, 153, 1);
                        transition: background .2s ease-in-out, box-shadow .2s ease-in-out;
                    }
                    .range-thumb::-moz-range-thumb {
                        width: 28px;
                        height: 28px;
                        border-radius: 50%;
                        background: #f0f0f0;
                        cursor: pointer;
                        border: none;
                        box-shadow: 0 0 10px rgba(52, 211, 153, 0.8), 0 0 5px rgba(52, 211, 153, 1);
                        transition: background .2s ease-in-out, box-shadow .2s ease-in-out;
                    }
                    .range-thumb::-webkit-slider-thumb:hover, .range-thumb::-moz-range-thumb:hover {
                        background: #fff;
                        box-shadow: 0 0 15px rgba(52, 211, 153, 1), 0 0 10px rgba(52, 211, 153, 1);
                    }
                    .range-thumb::-webkit-slider-thumb:active,
                    .range-thumb::-moz-range-thumb:active {
                        transform: scale(1.1);
                    }
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 8px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: #1e293b; /* slate-800 */
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: #475569; /* slate-600 */
                        border-radius: 4px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: #64748b; /* slate-500 */
                    }
                    @keyframes fade-in { 0% { opacity: 0; transform: translateY(10px); } 100% { opacity: 1; transform: translateY(0); } } 
                    .animate-fade-in { animation: fade-in 0.4s ease-in-out; }
                `}</style>
              </div>

              {history.length > 0 && (
                <div className="border-t border-slate-700/50">
                  <PasswordHistory 
                    history={history} 
                    onSelect={handleSelectFromHistory}
                    onClear={handleClearHistory}
                    onCopy={handleCopyToClipboard}
                    onDeleteItem={handleDeleteItemFromHistory}
                    onExport={handleExportHistory}
                  />
                </div>
              )}
            </div>

            {/* Static Footer (Strength & Generate) */}
            <div className="p-4 sm:p-6 border-t border-slate-700/50 bg-slate-900/80 flex-shrink-0 rounded-b-2xl">
              <div className="mb-4 sm:mb-6">
                <StrengthIndicator strength={strength} />
              </div>
              
              {
                {
                  'audit': (
                    <Tooltip text="Get AI analysis">
                         <button 
                            onClick={handleAuditPassword}
                            disabled={isAuditing || !auditPassword}
                            className="w-full bg-emerald-500 p-4 text-slate-900 font-bold text-lg uppercase flex items-center justify-center gap-4
                                      border-b-4 border-emerald-700 hover:bg-emerald-400 hover:border-emerald-600 transition-all duration-200 rounded-lg active:scale-[0.98] active:border-b-2
                                      disabled:bg-slate-600 disabled:border-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed"
                        >
                            {isAuditing ? <SpinnerIcon /> : <AuditIcon />}
                            Audit Password
                        </button>
                    </Tooltip>
                  ),
                  'bulk': (
                    <Tooltip text={`Generate ${bulkCount} ${bulkGenType}(s)`}>
                      <button 
                        onClick={handleBulkGenerate}
                        className="w-full bg-emerald-500 p-4 text-slate-900 font-bold text-lg uppercase flex items-center justify-center gap-4
                                  border-b-4 border-emerald-700 hover:bg-emerald-400 hover:border-emerald-600 transition-all duration-200 rounded-lg active:scale-[0.98] active:border-b-2"
                      >
                        <BulkIcon />
                        Generate Bulk
                      </button>
                    </Tooltip>
                  ),
                  'password': (
                    <Tooltip text={'Create a new random password (Ctrl+G)'}>
                      <button 
                        onClick={handleGenerate}
                        className="w-full bg-emerald-500 p-4 text-slate-900 font-bold text-lg uppercase flex items-center justify-center gap-4
                                  border-b-4 border-emerald-700 hover:bg-emerald-400 hover:border-emerald-600 transition-all duration-200 rounded-lg active:scale-[0.98] active:border-b-2"
                      >
                        Generate
                        <ArrowRightIcon/>
                      </button>
                    </Tooltip>
                  ),
                  'passphrase': (
                    <Tooltip text={'Create a new random passphrase (Ctrl+G)'}>
                      <button 
                        onClick={handleGenerate}
                        className="w-full bg-emerald-500 p-4 text-slate-900 font-bold text-lg uppercase flex items-center justify-center gap-4
                                  border-b-4 border-emerald-700 hover:bg-emerald-400 hover:border-emerald-600 transition-all duration-200 rounded-lg active:scale-[0.98] active:border-b-2"
                      >
                        Generate
                        <ArrowRightIcon/>
                      </button>
                    </Tooltip>
                  ),
                }[generatorType]
              }
            </div>
        </div>
      </div>
    </main>
  );
}

export default App;
