import { useDesignSystem } from '@/hooks/useDesignSystem';

type DatePickerProps = {
  value?: string; // expects YYYY-MM-DD or empty
  onChange: (value: string) => void;
  disabled?: boolean;
};

export default function DatePicker({ value, onChange, disabled }: DatePickerProps) {
  const ds = useDesignSystem();

  return (
    <input
      type="date"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors date-picker-input"
      style={{
        backgroundColor: ds.form.input.bg,
        borderColor: ds.form.input.border,
        color: ds.text.primary,
        '--tw-ring-color': ds.form.input.focus.ring,
      } as React.CSSProperties}
    />
  );
}


