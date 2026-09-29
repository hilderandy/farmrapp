import { prisma } from "@/lib/prisma";
import { createInventoryItem, deleteInventoryItem } from "@/lib/actions";

export default async function InventoryPage() {
  const items = await prisma.inventoryItem.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Inventory</h1>
        <p className="text-neutral-500">Seed, feed, fertilizer, and equipment on hand.</p>
      </div>

      <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-semibold">Add an item</h2>
        <form action={createInventoryItem} className="grid gap-3 sm:grid-cols-2">
          <input
            name="name"
            placeholder="Item name"
            required
            className="sm:col-span-2 rounded border border-neutral-300 px-3 py-2 text-sm"
          />
          <select
            name="category"
            defaultValue="OTHER"
            className="rounded border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="SEED">Seed</option>
            <option value="FEED">Feed</option>
            <option value="FERTILIZER">Fertilizer</option>
            <option value="EQUIPMENT">Equipment</option>
            <option value="OTHER">Other</option>
          </select>
          <input
            name="unit"
            placeholder="Unit (e.g. kg, bags)"
            required
            className="rounded border border-neutral-300 px-3 py-2 text-sm"
          />
          <label className="flex flex-col gap-1 text-xs text-neutral-500">
            Quantity
            <input
              type="number"
              step="any"
              name="quantity"
              defaultValue={0}
              className="rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-neutral-500">
            Low stock threshold
            <input
              type="number"
              step="any"
              name="lowStockAt"
              defaultValue={0}
              className="rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
            />
          </label>
          <button
            type="submit"
            className="sm:col-span-2 rounded bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
          >
            Add item
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white shadow-sm">
        {items.length === 0 ? (
          <p className="p-4 text-sm text-neutral-500">No inventory yet. Add your first item above.</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {items.map((item) => {
              const low = item.quantity <= item.lowStockAt;
              return (
                <li key={item.id} className="flex items-center justify-between gap-4 p-4">
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-neutral-500">{item.category}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-medium ${low ? "text-red-600" : "text-neutral-700"}`}>
                      {item.quantity} {item.unit}
                      {low && " · low stock"}
                    </span>
                    <form action={deleteInventoryItem}>
                      <input type="hidden" name="id" value={item.id} />
                      <button type="submit" className="text-sm text-red-600 hover:underline">
                        Delete
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
