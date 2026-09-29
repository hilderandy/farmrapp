"use client";

import { useActionState } from "react";
import { login } from "@/lib/actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm"
    >
      <label className="flex flex-col gap-1 text-sm text-neutral-600">
        Usuario
        <input
          name="username"
          required
          autoFocus
          className="rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-neutral-600">
        Contraseña
        <input
          name="password"
          type="password"
          required
          className="rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
        />
      </label>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-60"
      >
        {pending ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
}
