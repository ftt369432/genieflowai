import React, { createContext, useContext, useState } from 'react';

interface SelectionContextType {
  selectedDocuments: Set<string>;
  toggleSelection: (id: string, multiSelect?: boolean) => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
}

const SelectionContext = createContext<SelectionContextType | null>(null);

export function SelectionProvider({ children }: { children: React.ReactNode }) {
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());

  const toggleSelection = (id: string, multiSelect = false) => {
    setSelectedDocuments(prev => {
      const next = new Set(multiSelect ? prev : []);
      if (prev.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedDocuments(new Set());
  const isSelected = (id: string) => selectedDocuments.has(id);

  return (
    <SelectionContext.Provider value={{
      selectedDocuments,
      toggleSelection,
      clearSelection,
      isSelected
    }}>
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection() {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error('useSelection must be used within a SelectionProvider');
  }
  return context;
} 