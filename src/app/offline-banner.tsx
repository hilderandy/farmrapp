"use client";

import { useOffline } from "next/offline";

export function OfflineBanner() {
  const isOffline = useOffline();

  if (!isOffline) {
    return null;
  }

  return (
    <div
      role="status"
      className="bg-amber-100 px-4 py-2 text-center text-sm font-medium text-amber-900"
    >
      Estás sin conexión. Las solicitudes pendientes se reintentarán cuando
      vuelvas a estar en línea.
    </div>
  );
}
