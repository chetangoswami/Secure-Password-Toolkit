import { useState, useCallback } from 'react';
import { PasswordOptions, PassphraseOptions, StrengthLevel } from '../types';
import { UPPERCASE_CHARS, LOWERCASE_CHARS, NUMBER_CHARS, SYMBOL_CHARS } from '../constants';
import { WORD_LIST } from '../constants/words';

export const usePasswordGenerator = () => {
  const [password, setPassword] = useState('');
  const [strength, setStrength] = useState<StrengthLevel>(StrengthLevel.EMPTY);
  const [entropy, setEntropy] = useState<number>(0);

  const updateStrength = useCallback((type: 'password' | 'passphrase', options: PasswordOptions | PassphraseOptions, value?: string) => {
    const passwordOptions = options as PasswordOptions;
    const passphraseOptions = options as PassphraseOptions;
    
    const currentVal = value ?? password;
    if (currentVal === '') {
      setStrength(StrengthLevel.EMPTY);
      setEntropy(0);
      return;
    }

    let entropy = 0;
    const log2 = (n: number) => Math.log(n) / Math.log(2);

    if (type === 'password') {
      let poolSize = 0;
      if (passwordOptions.includeUppercase) poolSize += UPPERCASE_CHARS.length;
      if (passwordOptions.includeLowercase) poolSize += LOWERCASE_CHARS.length;
      if (passwordOptions.includeNumbers) poolSize += NUMBER_CHARS.length;
      if (passwordOptions.includeSymbols) poolSize += SYMBOL_CHARS.length;

      const length = currentVal.length;

      if (poolSize > 0 && length > 0) {
        entropy = length * log2(poolSize);

        // --- Granular Analysis ---
        // 1. Deductions for Repetitions
        const charCounts: { [key: string]: number } = {};
        for (const char of currentVal) {
          charCounts[char] = (charCounts[char] || 0) + 1;
        }
        let repetitionPenalty = 0;
        Object.values(charCounts).forEach(count => {
          if (count > 1) {
            repetitionPenalty += (count - 1);
          }
        });
        entropy -= repetitionPenalty * 2; // Penalize each repeated character

        // 2. Deductions for Common Sequences
        const SEQUENCES = [
          'abcdefghijklmnopqrstuvwxyz',
          '0123456789',
          'qwertyuiop',
          'asdfghjkl',
          'zxcvbnm',
        ];
        const lowercasedValue = currentVal.toLowerCase();
        let sequencePenalty = 0;
        for (let i = 0; i < lowercasedValue.length - 2; i++) {
            const slice = lowercasedValue.substring(i, i + 3);
            const reversedSlice = slice.split('').reverse().join('');
            for (const seq of SEQUENCES) {
                if (seq.includes(slice) || seq.includes(reversedSlice)) {
                    sequencePenalty += 3; // Penalize for finding a 3-char sequence
                    break; 
                }
            }
        }
        entropy -= sequencePenalty;

        // 3. Bonuses for Character Type Variety
        let typesUsed = 0;
        if (/[A-Z]/.test(currentVal)) typesUsed++;
        if (/[a-z]/.test(currentVal)) typesUsed++;
        if (/[0-9]/.test(currentVal)) typesUsed++;
        if (/[^A-Za-z0-9]/.test(currentVal)) typesUsed++;

        if (typesUsed === 4) {
            entropy += 10;
        } else if (typesUsed === 3) {
            entropy += 5;
        }
      }
    } else { // passphrase
      const wordCount = passphraseOptions.wordCount;
      if (wordCount === 0) {
        setStrength(StrengthLevel.EMPTY);
        setEntropy(0);
        return;
      }

      entropy = wordCount * log2(WORD_LIST.length);

      if (passphraseOptions.capitalize) {
        entropy += wordCount;
      }

      if (passphraseOptions.includeNumber) {
        entropy += log2(100); 
      }
    }

    // Stricter thresholds for modern hardware
    if (entropy >= 80) {
      setStrength(StrengthLevel.STRONG); // Excellent (approx > centuries)
    } else if (entropy >= 60) {
      setStrength(StrengthLevel.MEDIUM); // Good (approx > months/years)
    } else if (entropy >= 40) {
      setStrength(StrengthLevel.WEAK); // Fair (approx > hours/days)
    } else if (entropy > 0) {
      setStrength(StrengthLevel.VERY_WEAK); // Poor (approx < minutes)
    } else {
      setStrength(StrengthLevel.EMPTY);
    }
    setEntropy(Math.max(0, entropy));
  }, [password]);

  const generatePassword = useCallback((options: PasswordOptions): string => {
    const { 
        length, 
        includeUppercase, 
        includeLowercase, 
        includeNumbers, 
        includeSymbols,
        minUppercase = 0,
        minLowercase = 0,
        minNumbers = 0,
        minSymbols = 0,
    } = options;

    const getChars = (charSet: string, count: number): string[] => {
        if (count <= 0) return [];
        const chars: string[] = [];
        for (let i = 0; i < count; i++) {
            chars.push(charSet[Math.floor(Math.random() * charSet.length)]);
        }
        return chars;
    };
    
    let passwordArray: string[] = [];
    let availableCharset = '';

    if (includeUppercase) {
        passwordArray.push(...getChars(UPPERCASE_CHARS, minUppercase));
        availableCharset += UPPERCASE_CHARS;
    }
    if (includeLowercase) {
        passwordArray.push(...getChars(LOWERCASE_CHARS, minLowercase));
        availableCharset += LOWERCASE_CHARS;
    }
    if (includeNumbers) {
        passwordArray.push(...getChars(NUMBER_CHARS, minNumbers));
        availableCharset += NUMBER_CHARS;
    }
    if (includeSymbols) {
        passwordArray.push(...getChars(SYMBOL_CHARS, minSymbols));
        availableCharset += SYMBOL_CHARS;
    }

    if (availableCharset === '') {
      return '';
    }

    const remainingLength = length - passwordArray.length;
    if (remainingLength > 0) {
        passwordArray.push(...getChars(availableCharset, remainingLength));
    }
    
    passwordArray = passwordArray.slice(0, length);
    
    // Fisher-Yates shuffle
    for (let i = passwordArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
    }
    
    return passwordArray.join('');
  }, []);

  const generatePassphrase = useCallback((options: PassphraseOptions): string => {
    const { wordCount, separator, capitalize, includeNumber } = options;
    const words = [];
    const usedIndices = new Set<number>();
    
    while(words.length < wordCount) {
        const randomIndex = Math.floor(Math.random() * WORD_LIST.length);
        if (!usedIndices.has(randomIndex)) {
            let word = WORD_LIST[randomIndex];
            if (capitalize) {
                word = word.charAt(0).toUpperCase() + word.slice(1);
            }
            words.push(word);
            usedIndices.add(randomIndex);
        }
    }

    if (includeNumber) {
        const numberIndex = Math.floor(Math.random() * (words.length + 1));
        words.splice(numberIndex, 0, String(Math.floor(Math.random() * 100)));
    }

    return words.join(separator);
  }, []);


  return { password, strength, entropy, generatePassword, generatePassphrase, setPassword, updateStrength };
};