// Pure permission rules, shared by server actions, pages and the layout.
//
// - ADMIN: everything, including managing users.
// - OPERATOR: day-to-day data entry (create/edit) outside of the money
//   sections; can't delete records and can't see Finanzas / Compras y Ventas /
//   Conceptos.
// - VIEWER: sees everything (including money sections), changes nothing.

export type Role = "ADMIN" | "OPERATOR" | "VIEWER";
export type Permission = "write" | "delete" | "finance" | "users";

const matrix: Record<Role, readonly Permission[]> = {
  ADMIN: ["write", "delete", "finance", "users"],
  OPERATOR: ["write"],
  VIEWER: ["finance"],
};

export function can(role: Role, permission: Permission): boolean {
  return matrix[role].includes(permission);
}

export const roleLabels: Record<Role, string> = {
  ADMIN: "Administrador",
  OPERATOR: "Operador",
  VIEWER: "Solo lectura",
};

export const roleDescriptions: Record<Role, string> = {
  ADMIN: "Acceso total, incluida la gestión de usuarios.",
  OPERATOR: "Carga y edita registros del día a día. No borra ni ve la parte financiera.",
  VIEWER: "Ve toda la información, pero no puede cargar, editar ni borrar nada.",
};
