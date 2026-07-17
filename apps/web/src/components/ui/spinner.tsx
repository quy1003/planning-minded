type Props = {
  className?: string;
  label?: string;
};

/** Spinner CSS thuần — không thêm lib icon. */
export function Spinner({ className, label }: Props) {
  return (
    <span
      role="status"
      aria-label={label ?? "Loading"}
      className={`inline-block size-4 animate-spin rounded-full border-2 border-zinc-300 border-t-teal-800 ${className ?? ""}`}
    />
  );
}
