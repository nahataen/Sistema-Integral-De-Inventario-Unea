import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface TableCreationContextType {
  isModalOpen: boolean;
  tableName: string;
  setTableName: (name: string) => void;
  openModal: () => void;
  closeModal: () => void;
}

const TableCreationContext = createContext<TableCreationContextType | undefined>(undefined);

export const useTableCreation = () => {
  const context = useContext(TableCreationContext);
  if (!context) {
    throw new Error('useTableCreation must be used within a TableCreationProvider');
  }
  return context;
};

interface TableCreationProviderProps {
  children: ReactNode;
}

export const TableCreationProvider: React.FC<TableCreationProviderProps> = ({ children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tableName, setTableName] = useState('');

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setTableName('');
  };

  return (
    <TableCreationContext.Provider
      value={{
        isModalOpen,
        tableName,
        setTableName,
        openModal,
        closeModal,
      }}
    >
      {children}
    </TableCreationContext.Provider>
  );
};