"use client";

export function DeleteButton({
  confirmMessage = "¿Estás seguro de que querés eliminar este registro? Esta acción no se puede deshacer.",
  className = "text-sm text-red-600 hover:underline",
  children = "Eliminar",
}: {
  confirmMessage?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
    >
      {children}
    </button>
  );
}
