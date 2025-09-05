'use client';

import { X } from 'lucide-react';
import { useEffect } from 'react';
import { useDesignSystem } from '@/hooks/useDesignSystem';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const ds = useDesignSystem();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Background overlay */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div
        className="relative w-full max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 transform transition-all"
        style={{
          backgroundColor: ds.bg.card,
          borderColor: ds.border.primary,
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3
            className="text-lg font-semibold"
            style={{ color: ds.text.primary }}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            style={{ color: ds.text.secondary }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4" style={{ color: ds.text.primary }}>
          {children}
        </div>
      </div>
    </div>
  );
}
