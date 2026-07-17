import type { ReactNode } from "react";
import { Spinner } from "./spinner";

type Props = {
  pending: boolean;
  /** Label khi idle. Pending: chỉ spinner (label vào sr-only cho a11y). */
  children: ReactNode;
  /** Nút nền tối (teal/red) → spinner trắng. */
  onDark?: boolean;
};

/** Nội dung nút: idle = chữ; pending = chỉ spinner xoay. */
export function ButtonPending({ pending, children, onDark }: Props) {
  if (pending) {
    return (
      <span className="inline-flex items-center justify-center">
        <Spinner
          className={
            onDark ? "border-white/35 border-t-white" : "border-border border-t-accent"
          }
        />
        <span className="sr-only">{children}</span>
      </span>
    );
  }

  return <>{children}</>;
}
