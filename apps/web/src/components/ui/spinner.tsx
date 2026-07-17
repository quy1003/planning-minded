type Props = {
  className?: string;
  label?: string;
};

/** Spinner CSS thuần — màu theo accent (không teal). */
export function Spinner({ className, label }: Props) {
  return (
    <span
      role="status"
      aria-label={label ?? "Loading"}
      className={`inline-block size-4 animate-spin rounded-full border-2 border-border border-t-accent ${className ?? ""}`}
    />
  );
}
