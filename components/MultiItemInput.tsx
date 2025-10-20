'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useDesignSystem } from '@/hooks/useDesignSystem';
import DatePicker from './DatePicker';

interface MultiItemInputProps {
  type: 'date' | 'url';
  value: string; // Comma-separated string
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  maxItems?: number;
  onPendingValueChange?: (value: string) => void; // Notify parent of pending value
}

export default function MultiItemInput({
  type,
  value,
  onChange,
  placeholder,
  label = 'Add new',
  maxItems = 10,
  onPendingValueChange
}: MultiItemInputProps) {
  const ds = useDesignSystem();
  const [newItem, setNewItem] = useState('');
  // Show input by default if there are no items yet
  const [showInput, setShowInput] = useState(true);

  // Parse comma-separated value into array
  const items = value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];

  // Notify parent whenever pending value changes
  const updateNewItem = (val: string) => {
    setNewItem(val);
    if (onPendingValueChange) {
      onPendingValueChange(val);
    }
  };

  const handleAdd = () => {
    if (!newItem.trim()) return;
    
    const updatedItems = [...items, newItem.trim()];
    onChange(updatedItems.join(','));
    updateNewItem('');
    // Keep input visible after adding
    setShowInput(true);
  };

  const handleRemove = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    onChange(updatedItems.join(','));
  };

  const canAddMore = items.length < maxItems;

  return (
    <div className="space-y-2">
      {/* Display existing items */}
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-2 rounded-lg"
              style={{
                backgroundColor: ds.bg.surface,
                borderColor: ds.border.primary,
                borderWidth: '1px',
                borderStyle: 'solid'
              }}
            >
              <div className="flex-1 text-sm" style={{ color: ds.text.primary }}>
                {type === 'date' ? formatDate(item) : item}
              </div>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="p-1 rounded hover:bg-opacity-10 transition-colors"
                style={{ color: ds.text.secondary }}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new item */}
      {showInput ? (
        <div className="space-y-2">
          {type === 'date' ? (
            <DatePicker value={newItem} onChange={updateNewItem} />
          ) : (
            <input
              type="url"
              value={newItem}
              onChange={(e) => updateNewItem(e.target.value)}
              placeholder={placeholder || 'Enter URL'}
              className="w-full p-3 rounded-lg"
              style={{
                backgroundColor: ds.form.input.bg,
                borderColor: ds.form.input.border,
                color: ds.text.primary,
                borderWidth: '1px',
                borderStyle: 'solid',
                outline: 'none'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAdd();
                }
              }}
            />
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={!newItem.trim()}
              className="px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
              style={{
                backgroundColor: ds.button.primary.bg,
                color: ds.button.primary.text
              }}
            >
              {type === 'date' ? '複数の投稿日を追加' : 'URLを追加'}
            </button>
            {items.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  updateNewItem('');
                  setShowInput(false);
                }}
                className="px-4 py-2 rounded-lg text-sm transition-colors"
                style={{
                  color: ds.text.secondary,
                  backgroundColor: ds.bg.surface
                }}
              >
                キャンセル
              </button>
            )}
          </div>
        </div>
      ) : (
        canAddMore && (
          <button
            type="button"
            onClick={() => setShowInput(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors"
            style={{
              color: ds.button.primary.text,
              backgroundColor: ds.button.primary.bg
            }}
          >
            <Plus size={16} />
            {label}
          </button>
        )
      )}
    </div>
  );
}

// Helper to format date for display
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    }).format(date);
  } catch {
    return dateString;
  }
}

