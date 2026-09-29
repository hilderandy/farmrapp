import { getCurrentUser } from "@/lib/session";
import { roleDescriptions, roleLabels } from "@/lib/permissions";
import { changeOwnPassword } from "@/lib/actions";

export default async function AccountPage({ searchParams }: PageProps<"/account">) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : "";
  const ok = typeof params.ok === "string" ? params.ok : "";

  return (
    <div className="flex max-w-xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Mi cuenta</h1>
        <p className="text-neutral-500">
          {user.name ?? user.username} · usuario <strong>{user.username}</strong>
        </p>
      </div>

      <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
        <h2 className="font-semibold">Perfil: {roleLabels[user.role]}</h2>
        <p className="mt-1 text-sm text-neutral-500">{roleDescriptions[user.role]}</p>
      </section>

      {error && (
        <p className="rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}
      {ok && (
        <p className="rounded border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">{ok}</p>
      )}

      <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-semibold">Cambiar contraseña</h2>
        <form action={changeOwnPassword} className="grid gap-3">
          <input
            type="password"
            name="current"
            placeholder="Contraseña actual"
            required
            autoComplete="current-password"
            className="rounded border border-neutral-300 px-3 py-2 text-sm"
          />
          <input
            type="password"
            name="next"
            placeholder="Nueva contraseña (mínimo 8 caracteres)"
            required
            minLength={8}
            autoComplete="new-password"
            className="rounded border border-neutral-300 px-3 py-2 text-sm"
          />
          <input
            type="password"
            name="confirm"
            placeholder="Repetí la nueva contraseña"
            required
            minLength={8}
            autoComplete="new-password"
            className="rounded border border-neutral-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
          >
            Cambiar contraseña
          </button>
        </form>
      </section>
    </div>
  );
}
