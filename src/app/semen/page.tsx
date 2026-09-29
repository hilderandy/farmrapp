import { prisma } from "@/lib/prisma";
import { Can } from "@/app/can";
import { createSemenBatch, updateSemenBatch, deleteSemenBatch } from "@/lib/actions";
import { DeleteButton } from "../delete-button";

function toDateInput(value: Date | null) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

export default async function SemenPage() {
  const batches = await prisma.semenBatch.findMany({
    orderBy: { bullName: "asc" },
  });

  const totalStraws = batches.reduce((sum, b) => sum + b.quantity, 0);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Registro de Semen</h1>
        <p className="text-neutral-500">
          Controlá el stock de pajillas por toro para inseminación artificial.
        </p>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="text-2xl font-semibold text-green-700">{totalStraws}</div>
        <div className="text-sm text-neutral-500">Pajillas totales en stock</div>
      </div>

      <Can perm="write">
        <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-semibold">Agregar lote de semen</h2>
          <form action={createSemenBatch} className="grid gap-3 sm:grid-cols-2">
            <input
              name="bullName"
              placeholder="Nombre del toro"
              required
              className="rounded border border-neutral-300 px-3 py-2 text-sm"
            />
            <input
              name="breed"
              placeholder="Raza del toro"
              className="rounded border border-neutral-300 px-3 py-2 text-sm"
            />
            <input
              name="code"
              placeholder="Código / lote"
              className="rounded border border-neutral-300 px-3 py-2 text-sm"
            />
            <label className="flex flex-col gap-1 text-xs text-neutral-500">
              Cantidad de pajillas
              <input
                type="number"
                step="1"
                name="quantity"
                defaultValue={0}
                className="rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
              />
            </label>
            <input
              name="supplier"
              placeholder="Proveedor"
              className="rounded border border-neutral-300 px-3 py-2 text-sm"
            />
            <label className="flex flex-col gap-1 text-xs text-neutral-500">
              Fecha de compra
              <input
                type="date"
                name="purchaseDate"
                className="rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
              />
            </label>
            <textarea
              name="notes"
              placeholder="Notas"
              className="sm:col-span-2 rounded border border-neutral-300 px-3 py-2 text-sm"
              rows={2}
            />
            <button
              type="submit"
              className="sm:col-span-2 rounded bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
            >
              Agregar lote
            </button>
          </form>
        </section>
      </Can>

      <section className="rounded-lg border border-neutral-200 bg-white shadow-sm">
        {batches.length === 0 ? (
          <p className="p-4 text-sm text-neutral-500">
            Todavía no hay lotes de semen registrados. Agregá el primero arriba.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {batches.map((b) => (
              <li key={b.id} className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-medium">
                      {b.bullName}
                      {b.breed && <span className="text-neutral-400"> · {b.breed}</span>}
                    </div>
                    <div className="text-sm text-neutral-500">
                      {b.code && `Lote ${b.code} · `}
                      {b.supplier && `Proveedor: ${b.supplier} · `}
                      {b.purchaseDate &&
                        `Comprado ${new Date(b.purchaseDate).toLocaleDateString("es-PY")}`}
                    </div>
                    {b.notes && <div className="text-sm text-neutral-400">{b.notes}</div>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-sm font-medium ${b.quantity <= 0 ? "text-red-600" : "text-green-700"}`}
                    >
                      {b.quantity} pajillas
                    </span>
                    <Can perm="delete">
                      <form action={deleteSemenBatch}>
                        <input type="hidden" name="id" value={b.id} />
                        <DeleteButton
                          confirmMessage={`¿Eliminar el lote de "${b.bullName}"? Esta acción no se puede deshacer.`}
                        />
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
                      action={updateSemenBatch}
                      className="mt-2 grid gap-2 rounded border border-neutral-200 p-3 sm:grid-cols-2"
                    >
                      <input type="hidden" name="id" value={b.id} />
                      <input
                        name="bullName"
                        defaultValue={b.bullName}
                        required
                        className="rounded border border-neutral-300 px-3 py-2 text-sm"
                      />
                      <input
                        name="breed"
                        defaultValue={b.breed ?? ""}
                        placeholder="Raza del toro"
                        className="rounded border border-neutral-300 px-3 py-2 text-sm"
                      />
                      <input
                        name="code"
                        defaultValue={b.code ?? ""}
                        placeholder="Código / lote"
                        className="rounded border border-neutral-300 px-3 py-2 text-sm"
                      />
                      <label className="flex flex-col gap-1 text-xs text-neutral-500">
                        Cantidad de pajillas
                        <input
                          type="number"
                          step="1"
                          name="quantity"
                          defaultValue={b.quantity}
                          className="rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
                        />
                      </label>
                      <input
                        name="supplier"
                        defaultValue={b.supplier ?? ""}
                        placeholder="Proveedor"
                        className="rounded border border-neutral-300 px-3 py-2 text-sm"
                      />
                      <label className="flex flex-col gap-1 text-xs text-neutral-500">
                        Fecha de compra
                        <input
                          type="date"
                          name="purchaseDate"
                          defaultValue={toDateInput(b.purchaseDate)}
                          className="rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
                        />
                      </label>
                      <textarea
                        name="notes"
                        defaultValue={b.notes ?? ""}
                        placeholder="Notas"
                        className="sm:col-span-2 rounded border border-neutral-300 px-3 py-2 text-sm"
                        rows={2}
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
