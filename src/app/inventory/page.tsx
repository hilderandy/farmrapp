import { prisma } from "@/lib/prisma";
import { Can } from "@/app/can";
import { createInventoryItem, updateInventoryItem, deleteInventoryItem } from "@/lib/actions";
import { DeleteButton } from "../delete-button";

const categoryLabels: Record<string, string> = {
  SEED: "Semilla",
  FEED: "Alimento",
  FERTILIZER: "Fertilizante",
  EQUIPMENT: "Equipo",
  OTHER: "Otro",
};

export default async function InventoryPage() {
  const [items, families] = await Promise.all([
    prisma.inventoryItem.findMany({
      orderBy: { name: "asc" },
      include: { productFamily: true },
    }),
    prisma.productFamily.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Inventario</h1>
        <p className="text-neutral-500">Semillas, alimento, fertilizante y equipo disponible.</p>
      </div>

      <Can perm="write">
        <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-semibold">Agregar ítem</h2>
          <form action={createInventoryItem} className="grid gap-3 sm:grid-cols-2">
            <input
              name="name"
              placeholder="Nombre del ítem"
              required
              className="sm:col-span-2 rounded border border-neutral-300 px-3 py-2 text-sm"
            />
            <select
              name="category"
              defaultValue="OTHER"
              className="rounded border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="SEED">Semilla</option>
              <option value="FEED">Alimento</option>
              <option value="FERTILIZER">Fertilizante</option>
              <option value="EQUIPMENT">Equipo</option>
              <option value="OTHER">Otro</option>
            </select>
            <input
              name="unit"
              placeholder="Unidad (ej. kg, bolsas)"
              required
              className="rounded border border-neutral-300 px-3 py-2 text-sm"
            />
            <label className="flex flex-col gap-1 text-xs text-neutral-500">
              Cantidad
              <input
                type="number"
                step="any"
                name="quantity"
                defaultValue={0}
                className="rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-neutral-500">
              Umbral de stock bajo
              <input
                type="number"
                step="any"
                name="lowStockAt"
                defaultValue={0}
                className="rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
              />
            </label>
            <select
              name="productFamilyId"
              defaultValue=""
              className="sm:col-span-2 rounded border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="">Familia de producto (opcional)</option>
              {families.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="sm:col-span-2 rounded bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
            >
              Agregar ítem
            </button>
          </form>
        </section>
      </Can>

      <section className="rounded-lg border border-neutral-200 bg-white shadow-sm">
        {items.length === 0 ? (
          <p className="p-4 text-sm text-neutral-500">Todavía no hay inventario. Agregá el primer ítem arriba.</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {items.map((item) => {
              const low = item.quantity <= item.lowStockAt;
              return (
                <li key={item.id} className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-neutral-500">
                        {categoryLabels[item.category]}
                        {item.productFamily && ` · ${item.productFamily.name}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-medium ${low ? "text-red-600" : "text-neutral-700"}`}>
                        {item.quantity} {item.unit}
                        {low && " · stock bajo"}
                      </span>
                      <Can perm="delete">
                        <form action={deleteInventoryItem}>
                          <input type="hidden" name="id" value={item.id} />
                          <DeleteButton
                            confirmMessage={`¿Eliminar el ítem "${item.name}"? Esta acción no se puede deshacer.`}
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
                        action={updateInventoryItem}
                        className="mt-2 grid gap-2 rounded border border-neutral-200 p-3 sm:grid-cols-2"
                      >
                        <input type="hidden" name="id" value={item.id} />
                        <input
                          name="name"
                          defaultValue={item.name}
                          required
                          className="sm:col-span-2 rounded border border-neutral-300 px-3 py-2 text-sm"
                        />
                        <select
                          name="category"
                          defaultValue={item.category}
                          className="rounded border border-neutral-300 px-3 py-2 text-sm"
                        >
                          <option value="SEED">Semilla</option>
                          <option value="FEED">Alimento</option>
                          <option value="FERTILIZER">Fertilizante</option>
                          <option value="EQUIPMENT">Equipo</option>
                          <option value="OTHER">Otro</option>
                        </select>
                        <input
                          name="unit"
                          defaultValue={item.unit}
                          required
                          className="rounded border border-neutral-300 px-3 py-2 text-sm"
                        />
                        <label className="flex flex-col gap-1 text-xs text-neutral-500">
                          Cantidad
                          <input
                            type="number"
                            step="any"
                            name="quantity"
                            defaultValue={item.quantity}
                            className="rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-xs text-neutral-500">
                          Umbral de stock bajo
                          <input
                            type="number"
                            step="any"
                            name="lowStockAt"
                            defaultValue={item.lowStockAt}
                            className="rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
                          />
                        </label>
                        <select
                          name="productFamilyId"
                          defaultValue={item.productFamilyId ?? ""}
                          className="sm:col-span-2 rounded border border-neutral-300 px-3 py-2 text-sm"
                        >
                          <option value="">Familia de producto (opcional)</option>
                          {families.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name}
                            </option>
                          ))}
                        </select>
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
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
