import { prisma } from "@/lib/prisma";
import { Can } from "@/app/can";
import { createProductFamily, updateProductFamily, deleteProductFamily } from "@/lib/actions";
import { DeleteButton } from "../delete-button";

export default async function ProductFamiliesPage() {
  const families = await prisma.productFamily.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { inventoryItems: true } } },
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Familias de Productos</h1>
        <p className="text-neutral-500">
          Agrupá los ítems de inventario en familias (ej. Lácteos, Veterinaria, Semillas).
        </p>
      </div>

      <Can perm="write">
        <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-semibold">Agregar familia</h2>
          <form action={createProductFamily} className="grid gap-3 sm:grid-cols-2">
            <input
              name="name"
              placeholder="Nombre de la familia"
              required
              className="rounded border border-neutral-300 px-3 py-2 text-sm"
            />
            <input
              name="notes"
              placeholder="Notas"
              className="rounded border border-neutral-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="sm:col-span-2 rounded bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
            >
              Agregar familia
            </button>
          </form>
        </section>
      </Can>

      <section className="rounded-lg border border-neutral-200 bg-white shadow-sm">
        {families.length === 0 ? (
          <p className="p-4 text-sm text-neutral-500">
            Todavía no hay familias de productos. Agregá la primera arriba.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {families.map((f) => (
              <li key={f.id} className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-medium">{f.name}</div>
                    <div className="text-sm text-neutral-500">
                      {f._count.inventoryItems} ítem(s) de inventario
                    </div>
                    {f.notes && <div className="text-sm text-neutral-400">{f.notes}</div>}
                  </div>
                  <Can perm="delete">
                    <form action={deleteProductFamily}>
                      <input type="hidden" name="id" value={f.id} />
                      <DeleteButton
                        confirmMessage={`¿Eliminar la familia "${f.name}"? Los ítems que la usan no se borran, solo quedan sin familia asignada.`}
                      />
                    </form>
                  </Can>
                </div>
                <Can perm="write">
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-green-700 hover:underline">
                      Editar
                    </summary>
                    <form
                      action={updateProductFamily}
                      className="mt-2 grid gap-2 rounded border border-neutral-200 p-3 sm:grid-cols-2"
                    >
                      <input type="hidden" name="id" value={f.id} />
                      <input
                        name="name"
                        defaultValue={f.name}
                        required
                        className="rounded border border-neutral-300 px-3 py-2 text-sm"
                      />
                      <input
                        name="notes"
                        defaultValue={f.notes ?? ""}
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
