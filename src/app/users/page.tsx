import { prisma } from "@/lib/prisma";
import { requirePagePermission } from "@/lib/session";
import { roleDescriptions, roleLabels, type Role } from "@/lib/permissions";
import { createUser, updateUser, resetUserPassword, deleteUser } from "@/lib/actions";
import { DeleteButton } from "../delete-button";

const roles: Role[] = ["ADMIN", "OPERATOR", "VIEWER"];

const roleStyles: Record<Role, string> = {
  ADMIN: "bg-green-100 text-green-800",
  OPERATOR: "bg-amber-100 text-amber-800",
  VIEWER: "bg-neutral-100 text-neutral-700",
};

function RoleSelect({ defaultValue }: { defaultValue: Role }) {
  return (
    <select
      name="role"
      defaultValue={defaultValue}
      className="rounded border border-neutral-300 px-3 py-2 text-sm"
    >
      {roles.map((r) => (
        <option key={r} value={r}>
          {roleLabels[r]}
        </option>
      ))}
    </select>
  );
}

export default async function UsersPage({ searchParams }: PageProps<"/users">) {
  const me = await requirePagePermission("users");
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : "";
  const ok = typeof params.ok === "string" ? params.ok : "";

  const users = await prisma.user.findMany({
    orderBy: [{ active: "desc" }, { username: "asc" }],
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Usuarios</h1>
        <p className="text-neutral-500">
          Creá usuarios para las personas que trabajan en la granja y elegí qué puede hacer cada una.
        </p>
      </div>

      {error && (
        <p className="rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}
      {ok && (
        <p className="rounded border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">{ok}</p>
      )}

      <section className="grid gap-3 sm:grid-cols-3">
        {roles.map((r) => (
          <div key={r} className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
            <span className={`rounded-full px-2 py-1 text-xs font-medium ${roleStyles[r]}`}>
              {roleLabels[r]}
            </span>
            <p className="mt-2 text-sm text-neutral-500">{roleDescriptions[r]}</p>
          </div>
        ))}
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-semibold">Agregar usuario</h2>
        <form action={createUser} className="grid gap-3 sm:grid-cols-2">
          <input
            name="username"
            placeholder="Usuario (ej. juan.perez)"
            required
            minLength={3}
            pattern="[A-Za-z0-9._\-]+"
            autoComplete="off"
            className="rounded border border-neutral-300 px-3 py-2 text-sm"
          />
          <input
            name="name"
            placeholder="Nombre completo"
            className="rounded border border-neutral-300 px-3 py-2 text-sm"
          />
          <input
            type="password"
            name="password"
            placeholder="Contraseña (mínimo 8 caracteres)"
            required
            minLength={8}
            autoComplete="new-password"
            className="rounded border border-neutral-300 px-3 py-2 text-sm"
          />
          <RoleSelect defaultValue="OPERATOR" />
          <button
            type="submit"
            className="sm:col-span-2 rounded bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
          >
            Agregar usuario
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white shadow-sm">
        <ul className="divide-y divide-neutral-100">
          {users.map((u) => {
            const isMe = u.id === me.id;
            return (
              <li key={u.id} className={`p-4 ${u.active ? "" : "opacity-60"}`}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-medium">
                      {u.name ?? u.username}{" "}
                      <span className="text-neutral-400">· {u.username}</span>
                      {isMe && <span className="text-neutral-400"> (vos)</span>}
                    </div>
                    <div className="text-sm text-neutral-500">
                      Creado el {new Date(u.createdAt).toLocaleDateString("es-PY")}
                      {!u.active && " · Desactivado"}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${roleStyles[u.role]}`}>
                      {roleLabels[u.role]}
                    </span>
                    {!isMe && (
                      <form action={deleteUser}>
                        <input type="hidden" name="id" value={u.id} />
                        <DeleteButton
                          confirmMessage={`¿Eliminar el usuario "${u.username}"? Si solo querés quitarle el acceso por un tiempo, mejor desactivalo.`}
                        />
                      </form>
                    )}
                  </div>
                </div>
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-green-700 hover:underline">
                    Editar
                  </summary>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    <form
                      action={updateUser}
                      className="grid gap-2 rounded border border-neutral-200 p-3"
                    >
                      <input type="hidden" name="id" value={u.id} />
                      <input
                        name="name"
                        defaultValue={u.name ?? ""}
                        placeholder="Nombre completo"
                        className="rounded border border-neutral-300 px-3 py-2 text-sm"
                      />
                      <RoleSelect defaultValue={u.role} />
                      <label className="flex items-center gap-2 text-sm text-neutral-600">
                        <input type="checkbox" name="active" defaultChecked={u.active} />
                        Activo (puede iniciar sesión)
                      </label>
                      <button
                        type="submit"
                        className="rounded bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
                      >
                        Guardar cambios
                      </button>
                    </form>
                    <form
                      action={resetUserPassword}
                      className="grid content-start gap-2 rounded border border-neutral-200 p-3"
                    >
                      <input type="hidden" name="id" value={u.id} />
                      <input
                        type="password"
                        name="password"
                        placeholder="Nueva contraseña (mínimo 8)"
                        required
                        minLength={8}
                        autoComplete="new-password"
                        className="rounded border border-neutral-300 px-3 py-2 text-sm"
                      />
                      <button
                        type="submit"
                        className="rounded border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                      >
                        Cambiar contraseña
                      </button>
                    </form>
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
