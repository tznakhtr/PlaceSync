import React, { useState } from 'react';
import { X } from 'lucide-react';

export interface TagInputProps {
  label?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  tags: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
  placeholder?: string;
  id?: string;
}

/**
 * TagInput component for skill management.
 * - Adds skill on pressing Enter or comma (,)
 * - Trims, converts to lowercase, ignores duplicates and empty entries
 * - Shows an interactive chip list with removal button
 * - Enforces maxTags limit (defaults to 30) with real-time counter
 */
export const TagInput: React.FC<TagInputProps> = ({
  label,
  helperText,
  error,
  required,
  disabled,
  tags = [],
  onChange,
  maxTags = 30,
  placeholder = 'Type a skill and press Enter or comma',
  id,
}) => {
  const [inputValue, setInputValue] = useState('');
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  const addTag = (rawTag: string) => {
    const cleaned = rawTag.trim().toLowerCase();
    if (!cleaned) return;
    if (tags.length >= maxTags) return;
    if (tags.includes(cleaned)) {
      setInputValue('');
      return;
    }
    onChange([...tags, cleaned]);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      // Remove last tag if input is empty
      onChange(tags.slice(0, -1));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.includes(',')) {
      // If user typed or pasted comma
      const parts = val.split(',');
      let newTags = [...tags];
      for (const part of parts) {
        const cleaned = part.trim().toLowerCase();
        if (cleaned && !newTags.includes(cleaned) && newTags.length < maxTags) {
          newTags.push(cleaned);
        }
      }
      onChange(newTags);
      setInputValue('');
    } else {
      setInputValue(val);
    }
  };

  const removeTag = (indexToRemove: number) => {
    if (disabled) return;
    onChange(tags.filter((_, idx) => idx !== indexToRemove));
  };

  const isAtLimit = tags.length >= maxTags;

  return (
    <div className="w-full text-left">
      <div className="flex items-center justify-between mb-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-grey-700"
          >
            {label}
            {required && <span className="text-danger ml-1">*</span>}
          </label>
        )}
        <span className="text-xs text-grey-500 font-medium">
          {tags.length} / {maxTags} skills
        </span>
      </div>

      <div
        className={`w-full rounded-lg border bg-surface p-2 transition-colors duration-150 min-h-[42px] flex flex-wrap items-center gap-1.5
          ${
            error
              ? 'border-danger focus-within:border-danger focus-within:ring-2 focus-within:ring-danger/20'
              : 'border-grey-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20'
          }
          ${disabled ? 'bg-grey-50 cursor-not-allowed' : ''}
        `}
      >
        {tags.map((tag, idx) => (
          <span
            key={`${tag}-${idx}`}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-navy-50 text-navy-800 border border-navy-100"
          >
            <span>{tag}</span>
            {!disabled && (
              <button
                type="button"
                onClick={() => removeTag(idx)}
                className="text-grey-400 hover:text-danger rounded-xs p-0.5 transition-colors"
                aria-label={`Remove ${tag}`}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </span>
        ))}

        {!disabled && !isAtLimit && (
          <input
            id={inputId}
            type="text"
            value={inputValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={tags.length === 0 ? placeholder : 'Add more...'}
            className="flex-1 min-w-[120px] bg-transparent text-sm text-grey-700 outline-none placeholder:text-grey-400 py-0.5 px-1"
          />
        )}
      </div>

      {error ? (
        <p className="mt-1.5 text-xs text-danger font-medium">{error}</p>
      ) : helperText ? (
        <p className="mt-1.5 text-xs text-grey-500">{helperText}</p>
      ) : null}
    </div>
  );
};
