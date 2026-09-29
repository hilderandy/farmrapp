import { getCurrentUser } from "@/lib/session";
import { can, type Permission } from "@/lib/permissions";

// Renders its children only when the current user has the given permission.
// Hiding a form is just UX — every server action checks permissions again.
export async function Can({
  perm,
  children,
}: {
  perm: Permission;
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  return can(user.role, perm) ? <>{children}</> : null;
}
