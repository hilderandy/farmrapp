import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Can } from "@/app/can";
import {
  updateAnimal,
  createReproEvent,
  updateReproEvent,
  deleteReproEvent,
  createCalf,
  updateCalf,
  deleteCalf,
} from "@/lib/actions";
import { DeleteButton } from "../../delete-button";

function toDateInput(value: Date | null) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

const statusLabels: Record<string, string> = {
  ACTIVE: "Activo",
  SOLD: "Vendido",
  DECEASED: "Fallecido",
};

const eventTypeLabels: Record<string, string> = {
  SERVICE: "Servicio",
  CONFIRMATION: "Confirmación de preñez",
  CALVING: "Parto",
  DRY_OFF: "Secado",
};

const sexLabels: Record<string, string> = {
  MALE: "Macho",
  FEMALE: "Hembra",
};

function daysBetween(from: Date, to: Date) {
  const ms = to.setHours(0, 0, 0, 0) - new Date(from).setHours(0, 0, 0, 0);
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export default async function AnimalDetailPage({
  params,
}: PageProps<"/livestock/[id]">) {
  const { id } = await params;

  const [animal, availableSemen] = await Promise.all([
    prisma.animal.findUnique({
      where: { id },
      include: {
        reproEvents: { orderBy: { date: "desc" }, include: { semenBatch: true } },
        calves: { orderBy: { birthDate: "desc" } },
        milkRecords: { orderBy: { date: "desc" }, take: 5 },
      },
    }),
    prisma.semenBatch.findMany({
      where: { quantity: { gt: 0 } },
      orderBy: { bullName: "asc" },
    }),
  ]);

  if (!animal) notFound();

  const lastCalving = animal.reproEvents.find((e) => e.type === "CALVING");
  const lastDryOff = animal.reproEvents.find((e) => e.type === "DRY_OFF");
  const isDry =
    lastDryOff &&
    (!lastCalving || new Date(lastDryOff.date) > new Date(lastCalving.date));

  let lactationStatus: string;
  if (isDry) {
    lactationStatus = "Vaca seca (sin lactancia activa)";
  } else if (lastCalving) {
    const days = daysBetween(new Date(lastCalving.date), new Date());
    lactationStatus = `${days} días en lactancia (parto ${new Date(
      lastCalving.date,
    ).toLocaleDateString("es-PY")})`;
  } else {
    lactationStatus = "Sin parto registrado";
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/livestock" className="text-sm text-green-700 hover:underline">
          ← Volver a Ganado
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">
              {animal.name} <span className="text-neutral-400">· {animal.species}</span>
            </h1>
            <p className="text-neutral-500">
              {animal.breed ?? "Raza desconocida"} · {statusLabels[animal.status]}
              {animal.birthDate &&
                ` · Nació ${new Date(animal.birthDate).toLocaleDateString("es-PY")}`}
            </p>
          </div>
        </div>
        <Can perm="write">
          <details className="mt-2">
            <summary className="cursor-pointer text-sm text-green-700 hover:underline">
              Editar datos del animal
            </summary>
            <form
              action={updateAnimal}
              className="mt-2 grid gap-2 rounded border border-neutral-200 bg-white p-3 sm:grid-cols-2"
            >
              <input type="hidden" name="id" value={animal.id} />
              <input
                name="name"
                defaultValue={animal.name}
                required
                className="rounded border border-neutral-300 px-3 py-2 text-sm"
              />
              <input
                name="species"
                defaultValue={animal.species}
                required
                className="rounded border border-neutral-300 px-3 py-2 text-sm"
              />
              <input
                name="breed"
                defaultValue={animal.breed ?? ""}
                placeholder="Raza"
                className="rounded border border-neutral-300 px-3 py-2 text-sm"
              />
              <select
                name="status"
                defaultValue={animal.status}
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
                  defaultValue={toDateInput(animal.birthDate)}
                  className="rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-900 sm:w-1/2"
                />
              </label>
              <textarea
                name="notes"
                defaultValue={animal.notes ?? ""}
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
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="text-sm text-neutral-500">Estado de lactancia</div>
        <div className="text-xl font-semibold text-green-700">{lactationStatus}</div>
      </div>

      <Can perm="write">
        <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-semibold">Registrar movimiento reproductivo</h2>
          <form action={createReproEvent} className="grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="animalId" value={animal.id} />
            <select
              name="type"
              defaultValue="SERVICE"
              className="rounded border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="SERVICE">Servicio</option>
              <option value="CONFIRMATION">Confirmación de preñez</option>
              <option value="CALVING">Parto</option>
              <option value="DRY_OFF">Secado</option>
            </select>
            <label className="flex flex-col gap-1 text-xs text-neutral-500">
              Fecha
              <input
                type="date"
                name="date"
                className="rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
              />
            </label>
            <select
              name="semenBatchId"
              defaultValue=""
              className="sm:col-span-2 rounded border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="">Semen usado (solo si es Servicio) — opcional</option>
              {availableSemen.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.bullName} ({b.quantity} pajillas)
                </option>
              ))}
            </select>
            <input
              name="notes"
              placeholder="Notas"
              className="sm:col-span-2 rounded border border-neutral-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="sm:col-span-2 rounded bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
            >
              Registrar movimiento
            </button>
          </form>
        </section>
      </Can>

      <section className="rounded-lg border border-neutral-200 bg-white shadow-sm">
        <h2 className="p-4 pb-0 font-semibold">Historial reproductivo</h2>
        {animal.reproEvents.length === 0 ? (
          <p className="p-4 text-sm text-neutral-500">Todavía no hay movimientos registrados.</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {animal.reproEvents.map((e) => (
              <li key={e.id} className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-medium">
                      {eventTypeLabels[e.type]}
                      {e.semenBatch && (
                        <span className="text-xs font-normal text-neutral-400">
                          {" "}
                          · {e.semenBatch.bullName}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-neutral-500">
                      {new Date(e.date).toLocaleDateString("es-PY")}
                    </div>
                    {e.notes && <div className="text-sm text-neutral-400">{e.notes}</div>}
                  </div>
                  <Can perm="delete">
                    <form action={deleteReproEvent}>
                      <input type="hidden" name="id" value={e.id} />
                      <input type="hidden" name="animalId" value={animal.id} />
                      <DeleteButton confirmMessage="¿Eliminar este movimiento reproductivo? Esta acción no se puede deshacer." />
                    </form>
                  </Can>
                </div>
                <Can perm="write">
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-green-700 hover:underline">
                      Editar
                    </summary>
                    <form
                      action={updateReproEvent}
                      className="mt-2 grid gap-2 rounded border border-neutral-200 p-3 sm:grid-cols-2"
                    >
                      <input type="hidden" name="id" value={e.id} />
                      <input type="hidden" name="animalId" value={animal.id} />
                      <select
                        name="type"
                        defaultValue={e.type}
                        className="rounded border border-neutral-300 px-3 py-2 text-sm"
                      >
                        <option value="SERVICE">Servicio</option>
                        <option value="CONFIRMATION">Confirmación de preñez</option>
                        <option value="CALVING">Parto</option>
                        <option value="DRY_OFF">Secado</option>
                      </select>
                      <label className="flex flex-col gap-1 text-xs text-neutral-500">
                        Fecha
                        <input
                          type="date"
                          name="date"
                          defaultValue={toDateInput(e.date)}
                          className="rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
                        />
                      </label>
                      <select
                        name="semenBatchId"
                        defaultValue={e.semenBatchId ?? ""}
                        className="sm:col-span-2 rounded border border-neutral-300 px-3 py-2 text-sm"
                      >
                        <option value="">Semen usado (solo si es Servicio) — opcional</option>
                        {e.semenBatch && (
                          <option value={e.semenBatch.id}>
                            {e.semenBatch.bullName} (actual)
                          </option>
                        )}
                        {availableSemen
                          .filter((b) => b.id !== e.semenBatchId)
                          .map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.bullName} ({b.quantity} pajillas)
                            </option>
                          ))}
                      </select>
                      <input
                        name="notes"
                        defaultValue={e.notes ?? ""}
                        placeholder="Notas"
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

      <Can perm="write">
        <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-semibold">Registrar cría</h2>
          <form action={createCalf} className="grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="motherId" value={animal.id} />
            <input
              name="tagNumber"
              placeholder="Número / caravana de la cría"
              className="rounded border border-neutral-300 px-3 py-2 text-sm"
            />
            <select
              name="sex"
              defaultValue="FEMALE"
              className="rounded border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="FEMALE">Hembra</option>
              <option value="MALE">Macho</option>
            </select>
            <input
              name="sireName"
              placeholder="Nombre del toro (padre)"
              className="rounded border border-neutral-300 px-3 py-2 text-sm"
            />
            <label className="flex flex-col gap-1 text-xs text-neutral-500">
              Fecha de nacimiento
              <input
                type="date"
                name="birthDate"
                required
                className="rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
              />
            </label>
            <input
              name="notes"
              placeholder="Notas"
              className="sm:col-span-2 rounded border border-neutral-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="sm:col-span-2 rounded bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
            >
              Registrar cría
            </button>
          </form>
        </section>
      </Can>

      <section className="rounded-lg border border-neutral-200 bg-white shadow-sm">
        <h2 className="p-4 pb-0 font-semibold">Crías de {animal.name}</h2>
        {animal.calves.length === 0 ? (
          <p className="p-4 text-sm text-neutral-500">Todavía no hay crías registradas.</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {animal.calves.map((c) => (
              <li key={c.id} className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-medium">
                      {c.tagNumber ?? "Sin número"}{" "}
                      <span className="text-xs font-normal text-neutral-400">
                        · {sexLabels[c.sex]}
                      </span>
                    </div>
                    <div className="text-sm text-neutral-500">
                      Nació {new Date(c.birthDate).toLocaleDateString("es-PY")}
                      {c.sireName && ` · Padre: ${c.sireName}`} · Madre: {animal.name}
                    </div>
                    {c.notes && <div className="text-sm text-neutral-400">{c.notes}</div>}
                  </div>
                  <Can perm="delete">
                    <form action={deleteCalf}>
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="motherId" value={animal.id} />
                      <DeleteButton confirmMessage="¿Eliminar este registro de cría? Esta acción no se puede deshacer." />
                    </form>
                  </Can>
                </div>
                <Can perm="write">
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-green-700 hover:underline">
                      Editar
                    </summary>
                    <form
                      action={updateCalf}
                      className="mt-2 grid gap-2 rounded border border-neutral-200 p-3 sm:grid-cols-2"
                    >
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="motherId" value={animal.id} />
                      <input
                        name="tagNumber"
                        defaultValue={c.tagNumber ?? ""}
                        placeholder="Número / caravana de la cría"
                        className="rounded border border-neutral-300 px-3 py-2 text-sm"
                      />
                      <select
                        name="sex"
                        defaultValue={c.sex}
                        className="rounded border border-neutral-300 px-3 py-2 text-sm"
                      >
                        <option value="FEMALE">Hembra</option>
                        <option value="MALE">Macho</option>
                      </select>
                      <input
                        name="sireName"
                        defaultValue={c.sireName ?? ""}
                        placeholder="Nombre del toro (padre)"
                        className="rounded border border-neutral-300 px-3 py-2 text-sm"
                      />
                      <label className="flex flex-col gap-1 text-xs text-neutral-500">
                        Fecha de nacimiento
                        <input
                          type="date"
                          name="birthDate"
                          required
                          defaultValue={toDateInput(c.birthDate)}
                          className="rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
                        />
                      </label>
                      <input
                        name="notes"
                        defaultValue={c.notes ?? ""}
                        placeholder="Notas"
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

      <section className="rounded-lg border border-neutral-200 bg-white shadow-sm">
        <h2 className="p-4 pb-0 font-semibold">Últimos registros de ordeñe</h2>
        {animal.milkRecords.length === 0 ? (
          <p className="p-4 text-sm text-neutral-500">Todavía no hay registros de ordeñe.</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {animal.milkRecords.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-4 p-4 text-sm">
                <span>{new Date(r.date).toLocaleDateString("es-PY")}</span>
                <span className="font-medium text-green-700">
                  {r.liters.toLocaleString("es-PY")} L
                </span>
              </li>
            ))}
          </ul>
        )}
        <Link href="/milk" className="block p-4 pt-0 text-sm text-green-700 hover:underline">
          Ver toda la producción lechera →
        </Link>
      </section>
    </div>
  );
}
