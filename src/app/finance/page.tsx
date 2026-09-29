import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Can } from "@/app/can";
import { requirePagePermission } from "@/lib/session";
import { createTransaction, updateTransaction, deleteTransaction } from "@/lib/actions";
import { DeleteButton } from "../delete-button";

function toDateInput(value: Date | null) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

const categoryLabels: Record<string, string> = {
  SALES: "Ventas",
  SUPPLIES: "Insumos",
  LABOR: "Mano de obra",
  EQUIPMENT: "Equipo",
  MAINTENANCE: "Mantenimiento",
  OTHER: "Otro",
};

const currency = new Intl.NumberFormat("es-PY", {
  style: "currency",
  currency: "PYG",
});

export default async function FinancePage({ searchParams }: PageProps<"/finance">) {
  await requirePagePermission("finance");
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const type = typeof params.type === "string" ? params.type : "";
  const from = typeof params.from === "string" ? params.from : "";
  const to = typeof params.to === "string" ? params.to : "";
  const hasFilters = Boolean(q || type || from || to);

  const where = {
    ...(type ? { type: type as never } : {}),
    ...(q
      ? {
          OR: [
            { description: { contains: q, mode: "insensitive" as const } },
            { contact: { name: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
    ...(from || to
      ? {
          date: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(`${to}T23:59:59`) } : {}),
          },
        }
      : {}),
  };

  const [transactions, contacts, concepts] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { date: "desc" },
      include: { contact: true, expenseConcept: true },
    }),
    prisma.contact.findMany({ orderBy: { name: "asc" } }),
    prisma.expenseConcept.findMany({
      where: { parentId: null },
      orderBy: { name: "asc" },
      include: { children: { orderBy: { name: "asc" } } },
    }),
  ]);

  const income = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + t.amount, 0);
  const expenses = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0);
  const balance = income - expenses;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Finanzas</h1>
        <p className="text-neutral-500">Controlá los ingresos y gastos de la granja.</p>
      </div>

      <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
        <form method="get" className="grid gap-3 sm:grid-cols-4">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Buscar por descripción o contacto"
            className="sm:col-span-2 rounded border border-neutral-300 px-3 py-2 text-sm"
          />
          <select
            name="type"
            defaultValue={type}
            className="rounded border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="">Ingresos y gastos</option>
            <option value="INCOME">Solo ingresos</option>
            <option value="EXPENSE">Solo gastos</option>
          </select>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 rounded bg-neutral-800 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-900"
            >
              Filtrar
            </button>
            {hasFilters && (
              <Link
                href="/finance"
                className="flex items-center rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
              >
                Limpiar
              </Link>
            )}
          </div>
          <label className="flex flex-col gap-1 text-xs text-neutral-500">
            Desde
            <input
              type="date"
              name="from"
              defaultValue={from}
              className="rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-neutral-500">
            Hasta
            <input
              type="date"
              name="to"
              defaultValue={to}
              className="rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
            />
          </label>
        </form>
      </section>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="text-2xl font-semibold text-green-700">
            {currency.format(income)}
          </div>
          <div className="text-sm text-neutral-500">
            Ingresos{hasFilters && " (filtrado)"}
          </div>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="text-2xl font-semibold text-red-600">
            {currency.format(expenses)}
          </div>
          <div className="text-sm text-neutral-500">
            Gastos{hasFilters && " (filtrado)"}
          </div>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
          <div
            className={`text-2xl font-semibold ${balance >= 0 ? "text-green-700" : "text-red-600"}`}
          >
            {currency.format(balance)}
          </div>
          <div className="text-sm text-neutral-500">
            Balance{hasFilters && " (filtrado)"}
          </div>
        </div>
      </div>

      <Can perm="write">
        <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-semibold">Agregar movimiento</h2>
          <form action={createTransaction} className="grid gap-3 sm:grid-cols-2">
            <select
              name="type"
              defaultValue="EXPENSE"
              className="rounded border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="INCOME">Ingreso</option>
              <option value="EXPENSE">Gasto</option>
            </select>
            <select
              name="category"
              defaultValue="OTHER"
              className="rounded border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="SALES">Ventas</option>
              <option value="SUPPLIES">Insumos</option>
              <option value="LABOR">Mano de obra</option>
              <option value="EQUIPMENT">Equipo</option>
              <option value="MAINTENANCE">Mantenimiento</option>
              <option value="OTHER">Otro</option>
            </select>
            <label className="flex flex-col gap-1 text-xs text-neutral-500">
              Monto (Gs.)
              <input
                type="number"
                step="any"
                name="amount"
                required
                defaultValue={0}
                className="rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-neutral-500">
              Fecha
              <input
                type="date"
                name="date"
                className="rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
              />
            </label>
            <input
              name="contactName"
              list="contacts-list"
              placeholder="Proveedor / cliente (opcional, podés escribir uno nuevo)"
              className="rounded border border-neutral-300 px-3 py-2 text-sm"
            />
            <datalist id="contacts-list">
              {contacts.map((c) => (
                <option key={c.id} value={c.name} />
              ))}
            </datalist>
            <select
              name="expenseConceptId"
              defaultValue=""
              className="rounded border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="">Concepto de gasto (opcional)</option>
              {concepts.map((c) => (
                <optgroup key={c.id} label={c.name}>
                  <option value={c.id}>{c.name}</option>
                  {c.children.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {"— " + sub.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <input
              name="description"
              placeholder="Descripción"
              className="sm:col-span-2 rounded border border-neutral-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="sm:col-span-2 rounded bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
            >
              Agregar movimiento
            </button>
          </form>
        </section>
      </Can>

      <section className="rounded-lg border border-neutral-200 bg-white shadow-sm">
        {transactions.length === 0 ? (
          <p className="p-4 text-sm text-neutral-500">
            {hasFilters
              ? "Ningún movimiento coincide con el filtro."
              : "Todavía no hay movimientos. Agregá el primero arriba."}
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {transactions.map((t) => (
              <li key={t.id} className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-medium">
                      {t.description || categoryLabels[t.category]}
                    </div>
                    <div className="text-sm text-neutral-500">
                      {categoryLabels[t.category]} · {new Date(t.date).toLocaleDateString("es-PY")}
                      {t.expenseConcept && ` · ${t.expenseConcept.name}`}
                      {t.contact && ` · ${t.contact.name}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-sm font-medium ${t.type === "INCOME" ? "text-green-700" : "text-red-600"}`}
                    >
                      {t.type === "INCOME" ? "+" : "-"}
                      {currency.format(t.amount)}
                    </span>
                    <Can perm="delete">
                      <form action={deleteTransaction}>
                        <input type="hidden" name="id" value={t.id} />
                        <DeleteButton confirmMessage="¿Eliminar este movimiento? Esta acción no se puede deshacer." />
                      </form>
                    </Can>
                  </div>
                </div>
                <Can perm="write">
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-green-700 hover:underline">
                      Editar
                    </summary>
                    <form
                      action={updateTransaction}
                      className="mt-2 grid gap-2 rounded border border-neutral-200 p-3 sm:grid-cols-2"
                    >
                      <input type="hidden" name="id" value={t.id} />
                      <select
                        name="type"
                        defaultValue={t.type}
                        className="rounded border border-neutral-300 px-3 py-2 text-sm"
                      >
                        <option value="INCOME">Ingreso</option>
                        <option value="EXPENSE">Gasto</option>
                      </select>
                      <select
                        name="category"
                        defaultValue={t.category}
                        className="rounded border border-neutral-300 px-3 py-2 text-sm"
                      >
                        <option value="SALES">Ventas</option>
                        <option value="SUPPLIES">Insumos</option>
                        <option value="LABOR">Mano de obra</option>
                        <option value="EQUIPMENT">Equipo</option>
                        <option value="MAINTENANCE">Mantenimiento</option>
                        <option value="OTHER">Otro</option>
                      </select>
                      <label className="flex flex-col gap-1 text-xs text-neutral-500">
                        Monto (Gs.)
                        <input
                          type="number"
                          step="any"
                          name="amount"
                          required
                          defaultValue={t.amount}
                          className="rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-xs text-neutral-500">
                        Fecha
                        <input
                          type="date"
                          name="date"
                          defaultValue={toDateInput(t.date)}
                          className="rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
                        />
                      </label>
                      <input
                        name="contactName"
                        list="contacts-list"
                        defaultValue={t.contact?.name ?? ""}
                        placeholder="Proveedor / cliente (opcional)"
                        className="rounded border border-neutral-300 px-3 py-2 text-sm"
                      />
                      <select
                        name="expenseConceptId"
                        defaultValue={t.expenseConceptId ?? ""}
                        className="rounded border border-neutral-300 px-3 py-2 text-sm"
                      >
                        <option value="">Concepto de gasto (opcional)</option>
                        {concepts.map((c) => (
                          <optgroup key={c.id} label={c.name}>
                            <option value={c.id}>{c.name}</option>
                            {c.children.map((sub) => (
                              <option key={sub.id} value={sub.id}>
                                {"— " + sub.name}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                      <input
                        name="description"
                        defaultValue={t.description ?? ""}
                        placeholder="Descripción"
                        className="sm:col-span-2 rounded border border-neutral-300 px-3 py-2 text-sm"
                      />
                      <button
                        type="submit"
                        className="sm:col-span-2 rounded bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
                      >
                        Guardar cambios
                      </button>
                    </form>
                  </details>
                </Can>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
