import { prisma } from "@/lib/prisma";
import { Can } from "@/app/can";
import { createMilkRecord, updateMilkRecord, deleteMilkRecord } from "@/lib/actions";
import { DeleteButton } from "../delete-button";

function toDateInput(value: Date | null) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

const sessionLabels: Record<string, string> = {
  MORNING: "Mañana",
  EVENING: "Tarde",
};

function startOfDay(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function startOfWeek(d: Date) {
  const copy = startOfDay(d);
  const day = copy.getDay();
  const diff = (day + 6) % 7; // Monday as first day
  copy.setDate(copy.getDate() - diff);
  return copy;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export default async function MilkPage() {
  const [records, activeAnimals] = await Promise.all([
    prisma.milkRecord.findMany({
      orderBy: { date: "desc" },
      include: { animal: true },
    }),
    prisma.animal.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
    }),
  ]);

  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);

  const sum = (from: Date) =>
    records
      .filter((r) => new Date(r.date) >= from)
      .reduce((total, r) => total + r.liters, 0);

  const today = sum(todayStart);
  const week = sum(weekStart);
  const month = sum(monthStart);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Producción Lechera</h1>
        <p className="text-neutral-500">
          Registrá la producción de leche por vaca y por turno de ordeñe.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="text-2xl font-semibold text-green-700">
            {today.toLocaleString("es-PY")} L
          </div>
          <div className="text-sm text-neutral-500">Hoy</div>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="text-2xl font-semibold text-green-700">
            {week.toLocaleString("es-PY")} L
          </div>
          <div className="text-sm text-neutral-500">Esta semana</div>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="text-2xl font-semibold text-green-700">
            {month.toLocaleString("es-PY")} L
          </div>
          <div className="text-sm text-neutral-500">Este mes</div>
        </div>
      </div>

      <Can perm="write">
        <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-semibold">Registrar ordeñe</h2>
          <form action={createMilkRecord} className="grid gap-3 sm:grid-cols-2">
            <select
              name="animalId"
              defaultValue=""
              className="rounded border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="">Rodeo general (sin especificar)</option>
              {activeAnimals.map((animal) => (
                <option key={animal.id} value={animal.id}>
                  {animal.name}
                </option>
              ))}
            </select>
            <select
              name="session"
              defaultValue="MORNING"
              className="rounded border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="MORNING">Ordeñe de mañana</option>
              <option value="EVENING">Ordeñe de tarde</option>
            </select>
            <label className="flex flex-col gap-1 text-xs text-neutral-500">
              Litros
              <input
                type="number"
                step="any"
                name="liters"
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
              Registrar ordeñe
            </button>
          </form>
        </section>
      </Can>

      <section className="rounded-lg border border-neutral-200 bg-white shadow-sm">
        {records.length === 0 ? (
          <p className="p-4 text-sm text-neutral-500">
            Todavía no hay registros de ordeñe. Agregá el primero arriba.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {records.map((r) => (
              <li key={r.id} className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-medium">
                      {r.animal?.name ?? "Rodeo general"}{" "}
                      <span className="text-xs font-normal text-neutral-400">
                        · {sessionLabels[r.session]}
                      </span>
                    </div>
                    <div className="text-sm text-neutral-500">
                      {new Date(r.date).toLocaleDateString("es-PY")}
                    </div>
                    {r.notes && <div className="text-sm text-neutral-400">{r.notes}</div>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-green-700">
                      {r.liters.toLocaleString("es-PY")} L
                    </span>
                    <Can perm="delete">
                      <form action={deleteMilkRecord}>
                        <input type="hidden" name="id" value={r.id} />
                        <DeleteButton confirmMessage="¿Eliminar este registro de ordeñe? Esta acción no se puede deshacer." />
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
                      action={updateMilkRecord}
                      className="mt-2 grid gap-2 rounded border border-neutral-200 p-3 sm:grid-cols-2"
                    >
                      <input type="hidden" name="id" value={r.id} />
                      <select
                        name="animalId"
                        defaultValue={r.animalId ?? ""}
                        className="rounded border border-neutral-300 px-3 py-2 text-sm"
                      >
                        <option value="">Rodeo general (sin especificar)</option>
                        {activeAnimals.map((animal) => (
                          <option key={animal.id} value={animal.id}>
                            {animal.name}
                          </option>
                        ))}
                      </select>
                      <select
                        name="session"
                        defaultValue={r.session}
                        className="rounded border border-neutral-300 px-3 py-2 text-sm"
                      >
                        <option value="MORNING">Ordeñe de mañana</option>
                        <option value="EVENING">Ordeñe de tarde</option>
                      </select>
                      <label className="flex flex-col gap-1 text-xs text-neutral-500">
                        Litros
                        <input
                          type="number"
                          step="any"
                          name="liters"
                          required
                          defaultValue={r.liters}
                          className="rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-xs text-neutral-500">
                        Fecha
                        <input
                          type="date"
                          name="date"
                          defaultValue={toDateInput(r.date)}
                          className="rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
                        />
                      </label>
                      <textarea
                        name="notes"
                        defaultValue={r.notes ?? ""}
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
