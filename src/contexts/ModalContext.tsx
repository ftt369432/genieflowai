import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ModalContextType {
  isOpen: Record<string, boolean>;
  openModal: (modalId: string) => void;
  closeModal: (modalId: string) => void;
  toggleModal: (modalId: string) => void;
}

const ModalContext = createContext<ModalContextType>({
  isOpen: {},
  openModal: () => {},
  closeModal: () => {},
  toggleModal: () => {},
});

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState<Record<string, boolean>>({});

  const openModal = (modalId: string) => {
    setIsOpen((prev) => ({ ...prev, [modalId]: true }));
  };

  const closeModal = (modalId: string) => {
    setIsOpen((prev) => ({ ...prev, [modalId]: false }));
  };

  const toggleModal = (modalId: string) => {
    setIsOpen((prev) => ({ ...prev, [modalId]: !prev[modalId] }));
  };

  return (
    <ModalContext.Provider value={{ isOpen, openModal, closeModal, toggleModal }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  return useContext(ModalContext);
} 