import React, { useState, KeyboardEvent } from 'react';
import { X, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

export function TagInput({ value, onChange, placeholder = 'Add tags...', maxTags = 10 }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const addTag = () => {
    if (!inputValue.trim()) return;
    
    // Prevent duplicate tags (case-insensitive)
    const normalizedTag = inputValue.trim();
    const isExisting = value.some(tag => tag.toLowerCase() === normalizedTag.toLowerCase());
    
    if (!isExisting && value.length < maxTags) {
      onChange([...value, normalizedTag]);
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      // Remove the last tag when backspace is pressed in an empty input
      removeTag(value[value.length - 1]);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2 mb-1">
        {value.map((tag) => (
          <div 
            key={tag}
            className="bg-primary/10 text-primary px-2 py-1 rounded-md text-sm flex items-center gap-1"
          >
            <span>{tag}</span>
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:text-primary/70 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
      
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            value.length >= maxTags 
              ? `Maximum ${maxTags} tags reached`
              : placeholder
          }
          disabled={value.length >= maxTags}
          className="flex-1"
        />
        <Button
          type="button"
          size="sm"
          onClick={addTag}
          disabled={!inputValue.trim() || value.length >= maxTags}
          variant="outline"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
} 