import { prisma } from "@/lib/prisma";
import { createAnimal, deleteAnimal } from "@/lib/actions";

const statusStyles: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  SOLD: "bg-blue-100 text-blue-800",
  DECEASED: "bg-neutral-200 text-neutral-600",
};

export default async function LivestockPage() {
  const animals = await prisma.animal.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Livestock</h1>
        <p className="text-neutral-500">Keep records for each animal on the farm.</p>
      </div>

      <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-semibold">Add an animal</h2>
        <form action={createAnimal} className="grid gap-3 sm:grid-cols-2">
          <input
            name="name"
            placeholder="Name / tag"
            required
            className="rounded border border-neutral-300 px-3 py-2 text-sm"
          />
          <input
            name="species"
            placeholder="Species (e.g. Cattle, Chicken)"
            required
            className="rounded border border-neutral-300 px-3 py-2 text-sm"
          />
          <input
            name="breed"
            placeholder="Breed"
            className="rounded border border-neutral-300 px-3 py-2 text-sm"
          />
          <select
            name="status"
            defaultValue="ACTIVE"
            className="rounded border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="ACTIVE">Active</option>
            <option value="SOLD">Sold</option>
            <option value="DECEASED">Deceased</option>
          </select>
          <label className="flex flex-col gap-1 text-xs text-neutral-500 sm:col-span-2">
            Birth date
            <input
              type="date"
              name="birthDate"
              className="rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-900 sm:w-1/2"
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
            Add animal
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white shadow-sm">
        {animals.length === 0 ? (
          <p className="p-4 text-sm text-neutral-500">No animals yet. Add your first one above.</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {animals.map((animal) => (
              <li key={animal.id} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <div className="font-medium">
                    {animal.name} <span className="text-neutral-400">· {animal.species}</span>
                  </div>
                  <div className="text-sm text-neutral-500">
                    {animal.breed ?? "Unknown breed"}
                    {animal.birthDate &&
                      ` · Born ${new Date(animal.birthDate).toLocaleDateString()}`}
                  </div>
                  {animal.notes && (
                    <div className="text-sm text-neutral-400">{animal.notes}</div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${statusStyles[animal.status]}`}
                  >
                    {animal.status}
                  </span>
                  <form action={deleteAnimal}>
                    <input type="hidden" name="id" value={animal.id} />
                    <button type="submit" className="text-sm text-red-600 hover:underline">
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
