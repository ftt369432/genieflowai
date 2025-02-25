import React from 'react';
import { Tag as TagIcon } from 'lucide-react';

interface TagSelectorProps {
  tags: string[];
  selectedTags: string[];
  onTagSelect: (tag: string) => void;
}

export function TagSelector({ tags, selectedTags, onTagSelect }: TagSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => onTagSelect(tag)}
          className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 transition-colors ${
            selectedTags.includes(tag)
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <TagIcon className="h-3 w-3" />
          {tag}
        </button>
      ))}
    </div>
  );
} 