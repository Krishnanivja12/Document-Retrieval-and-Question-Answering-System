import Button from '../ui/Button';

interface SessionInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  loading: boolean;
}

export const SessionInput = ({
  value,
  onChange,
  onSubmit,
  disabled,
  loading,
}: SessionInputProps) => {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-black">Session ID</label>
      <div className="flex gap-3">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter session ID from chat"
          disabled={disabled || loading}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50"
        />
        <Button
          onClick={onSubmit}
          disabled={!value.trim() || disabled || loading}
          loading={loading}
        >
          Evaluate
        </Button>
      </div>
    </div>
  );
};


