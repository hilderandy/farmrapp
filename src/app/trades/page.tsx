import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Can } from "@/app/can";
import { requirePagePermission } from "@/lib/session";
import { createTrade, updateTrade, deleteTrade } from "@/lib/actions";
import { DeleteButton } from "../delete-button";

function toDateInput(value: Date | null) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

const currency = new Intl.NumberFormat("es-PY", {
  style: "currency",
  currency: "PYG",
});

export default async function TradesPage({ searchParams }: PageProps<"/trades">) {
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
            { inventoryItem: { name: { contains: q, mode: "insensitive" as const } } },
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

  const [trades, contacts, items] = await Promise.all([
    prisma.trade.findMany({
      where,
      orderBy: { date: "desc" },
      include: { contact: true, inventoryItem: true },
    }),
    prisma.contact.findMany({ orderBy: { name: "asc" } }),
    prisma.inventoryItem.findMany({ orderBy: { name: "asc" } }),
  ]);

  const totalPurchases = trades
    .filter((t) => t.type === "PURCHASE")
    .reduce((sum, t) => sum + t.quantity * t.unitPrice, 0);
  const totalSales = trades
    .filter((t) => t.type === "SALE")
    .reduce((sum, t) => sum + t.quantity * t.unitPrice, 0);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Compras y Ventas</h1>
        <p className="text-neutral-500">
          Registrá compras a proveedores y ventas a clientes. El stock de Inventario y los
          movimientos de Finanzas se actualizan solos.
        </p>
      </div>

      <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
        <form method="get" className="grid gap-3 sm:grid-cols-4">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Buscar por producto, descripción o contacto"
            className="sm:col-span-2 rounded border border-neutral-300 px-3 py-2 text-sm"
          />
          <select
            name="type"
            defaultValue={type}
            className="rounded border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="">Compras y ventas</option>
            <option value="PURCHASE">Solo compras</option>
            <option value="SALE">Solo ventas</option>
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
                href="/trades"
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

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="text-2xl font-semibold text-red-600">
            {currency.format(totalPurchases)}
          </div>
          <div className="text-sm text-neutral-500">
            Total comprado{hasFilters && " (filtrado)"}
          </div>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="text-2xl font-semibold text-green-700">
            {currency.format(totalSales)}
          </div>
          <div className="text-sm text-neutral-500">
            Total vendido{hasFilters && " (filtrado)"}
          </div>
        </div>
      </div>

      <Can perm="write">
        <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-semibold">Registrar compra o venta</h2>
          <form action={createTrade} className="grid gap-3 sm:grid-cols-2">
            <select
              name="type"
              defaultValue="PURCHASE"
              className="rounded border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="PURCHASE">Compra</option>
              <option value="SALE">Venta</option>
            </select>
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
            <input
              name="productName"
              list="products-list"
              placeholder="Producto (opcional, podés escribir uno nuevo y se agrega al inventario)"
              className="sm:col-span-2 rounded border border-neutral-300 px-3 py-2 text-sm"
            />
            <datalist id="products-list">
              {items.map((i) => (
                <option key={i.id} value={i.name}>
                  {i.quantity} {i.unit} en stock
                </option>
              ))}
            </datalist>
            <input
              name="description"
              placeholder="Descripción (si no escribiste un producto)"
              className="sm:col-span-2 rounded border border-neutral-300 px-3 py-2 text-sm"
            />
            <label className="flex flex-col gap-1 text-xs text-neutral-500">
              Cantidad
              <input
                type="number"
                step="any"
                name="quantity"
                required
                defaultValue={1}
                className="rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-neutral-500">
              Precio unitario (Gs.)
              <input
                type="number"
                step="any"
                name="unitPrice"
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
              name="notes"
              placeholder="Notas"
              className="rounded border border-neutral-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="sm:col-span-2 rounded bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
            >
              Registrar
            </button>
          </form>
        </section>
      </Can>

      <section className="rounded-lg border border-neutral-200 bg-white shadow-sm">
        {trades.length === 0 ? (
          <p className="p-4 text-sm text-neutral-500">
            {hasFilters
              ? "Ningún movimiento coincide con el filtro."
              : "Todavía no hay compras ni ventas. Registrá la primera arriba."}
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {trades.map((t) => (
              <li key={t.id} className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-medium">
                      {t.inventoryItem?.name ?? t.description ?? "Sin descripción"}{" "}
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          t.type === "PURCHASE"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {t.type === "PURCHASE" ? "Compra" : "Venta"}
                      </span>
                    </div>
                    <div className="text-sm text-neutral-500">
                      {t.quantity} × {currency.format(t.unitPrice)} ·{" "}
                      {new Date(t.date).toLocaleDateString("es-PY")}
                      {t.contact && ` · ${t.contact.name}`}
                    </div>
                    {t.notes && <div className="text-sm text-neutral-400">{t.notes}</div>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-sm font-medium ${t.type === "PURCHASE" ? "text-red-600" : "text-green-700"}`}
                    >
                      {currency.format(t.quantity * t.unitPrice)}
                    </span>
                    <Can perm="delete">
                      <form action={deleteTrade}>
                        <input type="hidden" name="id" value={t.id} />
                        <DeleteButton confirmMessage="¿Eliminar este movimiento? Esto revierte el ajuste de stock y borra el movimiento de Finanzas asociado." />
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
                      action={updateTrade}
                      className="mt-2 grid gap-2 rounded border border-neutral-200 p-3 sm:grid-cols-2"
                    >
                      <input type="hidden" name="id" value={t.id} />
                      <select
                        name="type"
                        defaultValue={t.type}
                        className="rounded border border-neutral-300 px-3 py-2 text-sm"
                      >
                        <option value="PURCHASE">Compra</option>
                        <option value="SALE">Venta</option>
                      </select>
                      <input
                        name="contactName"
                        list="contacts-list"
                        defaultValue={t.contact?.name ?? ""}
                        placeholder="Proveedor / cliente (opcional)"
                        className="rounded border border-neutral-300 px-3 py-2 text-sm"
                      />
                      <input
                        name="productName"
                        list="products-list"
                        defaultValue={t.inventoryItem?.name ?? ""}
                        placeholder="Producto (opcional)"
                        className="sm:col-span-2 rounded border border-neutral-300 px-3 py-2 text-sm"
                      />
                      <input
                        name="description"
                        defaultValue={t.description ?? ""}
                        placeholder="Descripción (si no escribiste un producto)"
                        className="sm:col-span-2 rounded border border-neutral-300 px-3 py-2 text-sm"
                      />
                      <label className="flex flex-col gap-1 text-xs text-neutral-500">
                        Cantidad
                        <input
                          type="number"
                          step="any"
                          name="quantity"
                          required
                          defaultValue={t.quantity}
                          className="rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-xs text-neutral-500">
                        Precio unitario (Gs.)
                        <input
                          type="number"
                          step="any"
                          name="unitPrice"
                          required
                          defaultValue={t.unitPrice}
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
                        name="notes"
                        defaultValue={t.notes ?? ""}
                        placeholder="Notas"
                        className="rounded border border-neutral-300 px-3 py-2 text-sm"
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
