import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Can } from "@/app/can";
import { createAnimal, deleteAnimal } from "@/lib/actions";
import { DeleteButton } from "../delete-button";

const statusStyles: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  SOLD: "bg-blue-100 text-blue-800",
  DECEASED: "bg-neutral-200 text-neutral-600",
};

const statusLabels: Record<string, string> = {
  ACTIVE: "Activo",
  SOLD: "Vendido",
  DECEASED: "Fallecido",
};

export default async function LivestockPage({ searchParams }: PageProps<"/livestock">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const status = typeof params.status === "string" ? params.status : "";
  const hasFilters = Boolean(q || status);

  const animals = await prisma.animal.findMany({
    where: {
      ...(status ? { status: status as never } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { species: { contains: q, mode: "insensitive" as const } },
              { breed: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Ganado</h1>
        <p className="text-neutral-500">Llevá el registro de cada animal de la granja.</p>
      </div>

      <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
        <form method="get" className="grid gap-3 sm:grid-cols-4">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Buscar por nombre, especie o raza"
            className="sm:col-span-2 rounded border border-neutral-300 px-3 py-2 text-sm"
          />
          <select
            name="status"
            defaultValue={status}
            className="rounded border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="">Todos los estados</option>
            <option value="ACTIVE">Activo</option>
            <option value="SOLD">Vendido</option>
            <option value="DECEASED">Fallecido</option>
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
                href="/livestock"
                className="flex items-center rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
              >
                Limpiar
              </Link>
            )}
          </div>
        </form>
      </section>

      <Can perm="write">
        <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-semibold">Agregar animal</h2>
          <form action={createAnimal} className="grid gap-3 sm:grid-cols-2">
            <input
              name="name"
              placeholder="Nombre / caravana"
              required
              className="rounded border border-neutral-300 px-3 py-2 text-sm"
            />
            <input
              name="species"
              placeholder="Especie (ej. Vaca, Gallina)"
              required
              className="rounded border border-neutral-300 px-3 py-2 text-sm"
            />
            <input
              name="breed"
              placeholder="Raza"
              className="rounded border border-neutral-300 px-3 py-2 text-sm"
            />
            <select
              name="status"
              defaultValue="ACTIVE"
              className="rounded border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="ACTIVE">Activo</option>
              <option value="SOLD">Vendido</option>
              <option value="DECEASED">Fallecido</option>
            </select>
            <label className="flex flex-col gap-1 text-xs text-neutral-500 sm:col-span-2">
              Fecha de nacimiento
              <input
                type="date"
                name="birthDate"
                className="rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-900 sm:w-1/2"
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
              Agregar animal
            </button>
          </form>
        </section>
      </Can>

      <section className="rounded-lg border border-neutral-200 bg-white shadow-sm">
        {animals.length === 0 ? (
          <p className="p-4 text-sm text-neutral-500">
            {hasFilters
              ? "Ningún animal coincide con el filtro."
              : "Todavía no hay animales. Agregá el primero arriba."}
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {animals.map((animal) => (
              <li key={animal.id} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <div className="font-medium">
                    <Link href={`/livestock/${animal.id}`} className="hover:underline">
                      {animal.name}
                    </Link>{" "}
                    <span className="text-neutral-400">· {animal.species}</span>
                  </div>
                  <div className="text-sm text-neutral-500">
                    {animal.breed ?? "Raza desconocida"}
                    {animal.birthDate &&
                      ` · Nació ${new Date(animal.birthDate).toLocaleDateString("es-PY")}`}
                  </div>
                  {animal.notes && (
                    <div className="text-sm text-neutral-400">{animal.notes}</div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${statusStyles[animal.status]}`}
                  >
                    {statusLabels[animal.status]}
                  </span>
                  <Link href={`/livestock/${animal.id}`} className="text-sm text-green-700 hover:underline">
                    Ver ficha
                  </Link>
                  <Can perm="delete">
                    <form action={deleteAnimal}>
                      <input type="hidden" name="id" value={animal.id} />
                      <DeleteButton
                        confirmMessage={`¿Eliminar a "${animal.name}"? Esto también va a borrar su historial reproductivo y sus crías registradas. Esta acción no se puede deshacer.`}
                      />
                    </form>
                  </Can>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
