import Button from '../ui/Button';

interface InputBoxProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  disabled: boolean;
  loading: boolean;
}

export const InputBox = ({
  value,
  onChange,
  onSubmit,
  onKeyDown,
  disabled,
  loading,
}: InputBoxProps) => {
  return (
    <div className="space-y-3">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Type your question... (Shift+Enter for new line)"
        disabled={disabled || loading}
        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 resize-none"
        rows={3}
      />
      <Button
        onClick={onSubmit}
        disabled={!value.trim() || disabled || loading}
        loading={loading}
        className="w-full"
      >
        Send
      </Button>
    </div>
  );
};


