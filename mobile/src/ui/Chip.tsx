interface ChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

export function Chip({ label, selected, onClick }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`min-h-[44px] rounded-full border px-4 text-sm font-semibold transition-colors ${
        selected
          ? "border-brand bg-brand text-white"
          : "border-border bg-surface text-text-secondary hover:border-border-strong"
      }`}
    >
      {label}
    </button>
  );
}
