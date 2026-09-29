"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type NavDropdownProps = {
  label: string;
  items: { href: string; label: string }[];
};

export function NavDropdown({ label, items }: NavDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-1 hover:text-green-700"
      >
        {label}
        <span className="text-xs">▾</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-10 mt-2 flex min-w-44 flex-col rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50 hover:text-green-700"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
