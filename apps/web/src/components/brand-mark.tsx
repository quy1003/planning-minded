type Props = {
  className?: string;
  showWordmark?: boolean;
  /**
   * App shell hẹp: ẩn chữ TripMind trên mobile, chỉ còn pin.
   * Landing / marketing: để false (mặc định) để luôn hiện đủ brand.
   */
  collapseWordmarkOnMobile?: boolean;
};

/** Logo: ghim bản đồ trắng trên nền accent + chữ TripMind. */
export function BrandMark({
  className,
  showWordmark = true,
  collapseWordmarkOnMobile = false,
}: Props) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-accent-foreground shadow-sm shadow-accent/30">
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden fill="currentColor">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"
          />
        </svg>
      </span>
      {showWordmark ? (
        <span
          className={`font-display text-lg font-semibold tracking-tight text-foreground ${
            collapseWordmarkOnMobile ? "hidden sm:inline" : ""
          }`}
        >
          TripMind
        </span>
      ) : null}
    </span>
  );
}
