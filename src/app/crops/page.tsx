import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Can } from "@/app/can";
import { createCrop, updateCrop, deleteCrop } from "@/lib/actions";
import { DeleteButton } from "../delete-button";

function toDateInput(value: Date | null) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

const statusStyles: Record<string, string> = {
  PLANNED: "bg-neutral-100 text-neutral-700",
  PLANTED: "bg-amber-100 text-amber-800",
  GROWING: "bg-green-100 text-green-800",
  HARVESTED: "bg-blue-100 text-blue-800",
};

const statusLabels: Record<string, string> = {
  PLANNED: "Planificado",
  PLANTED: "Plantado",
  GROWING: "Creciendo",
  HARVESTED: "Cosechado",
};

export default async function CropsPage({ searchParams }: PageProps<"/crops">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const status = typeof params.status === "string" ? params.status : "";
  const hasFilters = Boolean(q || status);

  const crops = await prisma.crop.findMany({
    where: {
      ...(status ? { status: status as never } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { location: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Cultivos</h1>
        <p className="text-neutral-500">Seguí qué está plantado, dónde y en qué estado.</p>
      </div>

      <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
        <form method="get" className="grid gap-3 sm:grid-cols-4">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Buscar por nombre o ubicación"
            className="sm:col-span-2 rounded border border-neutral-300 px-3 py-2 text-sm"
          />
          <select
            name="status"
            defaultValue={status}
            className="rounded border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="">Todos los estados</option>
            <option value="PLANNED">Planificado</option>
            <option value="PLANTED">Plantado</option>
            <option value="GROWING">Creciendo</option>
            <option value="HARVESTED">Cosechado</option>
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
                href="/crops"
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
          <h2 className="mb-3 font-semibold">Agregar cultivo</h2>
          <form action={createCrop} className="grid gap-3 sm:grid-cols-2">
            <input
              name="name"
              placeholder="Nombre del cultivo (ej. Maíz)"
              required
              className="rounded border border-neutral-300 px-3 py-2 text-sm"
            />
            <input
              name="location"
              placeholder="Campo / ubicación"
              className="rounded border border-neutral-300 px-3 py-2 text-sm"
            />
            <select
              name="status"
              defaultValue="PLANNED"
              className="rounded border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="PLANNED">Planificado</option>
              <option value="PLANTED">Plantado</option>
              <option value="GROWING">Creciendo</option>
              <option value="HARVESTED">Cosechado</option>
            </select>
            <div />
            <label className="flex flex-col gap-1 text-xs text-neutral-500">
              Fecha de siembra
              <input
                type="date"
                name="plantedDate"
                className="rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-neutral-500">
              Fecha estimada de cosecha
              <input
                type="date"
                name="harvestDate"
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
              Agregar cultivo
            </button>
          </form>
        </section>
      </Can>

      <section className="rounded-lg border border-neutral-200 bg-white shadow-sm">
        {crops.length === 0 ? (
          <p className="p-4 text-sm text-neutral-500">
            {hasFilters
              ? "Ningún cultivo coincide con el filtro."
              : "Todavía no hay cultivos. Agregá el primero arriba."}
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {crops.map((crop) => (
              <li key={crop.id} className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-medium">{crop.name}</div>
                    <div className="text-sm text-neutral-500">
                      {crop.location ?? "Sin ubicación"}
                      {crop.plantedDate &&
                        ` · Sembrado ${new Date(crop.plantedDate).toLocaleDateString("es-PY")}`}
                      {crop.harvestDate &&
                        ` · Cosecha ${new Date(crop.harvestDate).toLocaleDateString("es-PY")}`}
                    </div>
                    {crop.notes && <div className="text-sm text-neutral-400">{crop.notes}</div>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${statusStyles[crop.status]}`}
                    >
                      {statusLabels[crop.status]}
                    </span>
                    <Can perm="delete">
                      <form action={deleteCrop}>
                        <input type="hidden" name="id" value={crop.id} />
                        <DeleteButton
                          confirmMessage={`¿Eliminar el cultivo "${crop.name}"? Esta acción no se puede deshacer.`}
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
                      action={updateCrop}
                      className="mt-2 grid gap-2 rounded border border-neutral-200 p-3 sm:grid-cols-2"
                    >
                      <input type="hidden" name="id" value={crop.id} />
                      <input
                        name="name"
                        defaultValue={crop.name}
                        required
                        className="rounded border border-neutral-300 px-3 py-2 text-sm"
                      />
                      <input
                        name="location"
                        defaultValue={crop.location ?? ""}
                        placeholder="Campo / ubicación"
                        className="rounded border border-neutral-300 px-3 py-2 text-sm"
                      />
                      <select
                        name="status"
                        defaultValue={crop.status}
                        className="rounded border border-neutral-300 px-3 py-2 text-sm"
                      >
                        <option value="PLANNED">Planificado</option>
                        <option value="PLANTED">Plantado</option>
                        <option value="GROWING">Creciendo</option>
                        <option value="HARVESTED">Cosechado</option>
                      </select>
                      <div />
                      <label className="flex flex-col gap-1 text-xs text-neutral-500">
                        Fecha de siembra
                        <input
                          type="date"
                          name="plantedDate"
                          defaultValue={toDateInput(crop.plantedDate)}
                          className="rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-xs text-neutral-500">
                        Fecha estimada de cosecha
                        <input
                          type="date"
                          name="harvestDate"
                          defaultValue={toDateInput(crop.harvestDate)}
                          className="rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
                        />
                      </label>
                      <textarea
                        name="notes"
                        defaultValue={crop.notes ?? ""}
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
