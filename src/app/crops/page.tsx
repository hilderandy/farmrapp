import { prisma } from "@/lib/prisma";
import { createCrop, deleteCrop } from "@/lib/actions";

const statusStyles: Record<string, string> = {
  PLANNED: "bg-neutral-100 text-neutral-700",
  PLANTED: "bg-amber-100 text-amber-800",
  GROWING: "bg-green-100 text-green-800",
  HARVESTED: "bg-blue-100 text-blue-800",
};

export default async function CropsPage() {
  const crops = await prisma.crop.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Crops</h1>
        <p className="text-neutral-500">Track what&apos;s planted, where, and its status.</p>
      </div>

      <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-semibold">Add a crop</h2>
        <form action={createCrop} className="grid gap-3 sm:grid-cols-2">
          <input
            name="name"
            placeholder="Crop name (e.g. Corn)"
            required
            className="rounded border border-neutral-300 px-3 py-2 text-sm"
          />
          <input
            name="location"
            placeholder="Field / location"
            className="rounded border border-neutral-300 px-3 py-2 text-sm"
          />
          <select
            name="status"
            defaultValue="PLANNED"
            className="rounded border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="PLANNED">Planned</option>
            <option value="PLANTED">Planted</option>
            <option value="GROWING">Growing</option>
            <option value="HARVESTED">Harvested</option>
          </select>
          <div />
          <label className="flex flex-col gap-1 text-xs text-neutral-500">
            Planted date
            <input
              type="date"
              name="plantedDate"
              className="rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-neutral-500">
            Expected harvest date
            <input
              type="date"
              name="harvestDate"
              className="rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
            />
          </label>
          <textarea
            name="notes"
            placeholder="Notes"
            className="sm:col-span-2 rounded border border-neutral-300 px-3 py-2 text-sm"
            rows={2}
          />
          <button
            type="submit"
            className="sm:col-span-2 rounded bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
          >
            Add crop
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white shadow-sm">
        {crops.length === 0 ? (
          <p className="p-4 text-sm text-neutral-500">No crops yet. Add your first one above.</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {crops.map((crop) => (
              <li key={crop.id} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <div className="font-medium">{crop.name}</div>
                  <div className="text-sm text-neutral-500">
                    {crop.location ?? "No location set"}
                    {crop.plantedDate &&
                      ` · Planted ${new Date(crop.plantedDate).toLocaleDateString()}`}
                    {crop.harvestDate &&
                      ` · Harvest ${new Date(crop.harvestDate).toLocaleDateString()}`}
                  </div>
                  {crop.notes && <div className="text-sm text-neutral-400">{crop.notes}</div>}
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${statusStyles[crop.status]}`}
                  >
                    {crop.status}
                  </span>
                  <form action={deleteCrop}>
                    <input type="hidden" name="id" value={crop.id} />
                    <button
                      type="submit"
                      className="text-sm text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
