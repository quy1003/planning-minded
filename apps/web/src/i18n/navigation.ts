import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/** Link / useRouter / redirect đã gắn locale prefix tự động. */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
