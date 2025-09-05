'use client';

import { useMemo } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

type DatePickerProps = {
  value?: string; // expects YYYY-MM-DD or empty
  onChange: (value: string) => void;
  disabled?: boolean;
};

function toDate(value?: string | null): Date | undefined {
  if (!value) return undefined;
  // Accept YYYY-MM-DD
  const parts = value.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts.map((p) => parseInt(p, 10));
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return new Date(y, m - 1, d);
    }
  }
  const d = new Date(value);
  return isNaN(d.getTime()) ? undefined : d;
}

function toYmd(date?: Date): string {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function DatePicker({ value, onChange, disabled }: DatePickerProps) {
  const selected = useMemo(() => toDate(value || ''), [value]);

  return (
    <div className="rdp-container">
      <DayPicker
        mode="single"
        selected={selected}
        onSelect={(day) => onChange(day ? toYmd(day) : '')}
        disabled={disabled}
        weekStartsOn={1}
        styles={{
          caption: { fontWeight: 600 },
          day_selected: { backgroundColor: '#2563eb', color: 'white' },
          day_today: { border: '1px solid #2563eb' },
        }}
      />
    </div>
  );
}


