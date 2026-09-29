import { prisma } from "@/lib/prisma";
import { Can } from "@/app/can";
import { createTask, updateTask, cycleTaskStatus, deleteTask } from "@/lib/actions";
import { DeleteButton } from "../delete-button";

function toDateInput(value: Date | null) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

const statusStyles: Record<string, string> = {
  TODO: "bg-neutral-100 text-neutral-700",
  IN_PROGRESS: "bg-amber-100 text-amber-800",
  DONE: "bg-green-100 text-green-800",
};

const statusLabels: Record<string, string> = {
  TODO: "Por hacer",
  IN_PROGRESS: "En curso",
  DONE: "Hecho",
};

const priorityStyles: Record<string, string> = {
  LOW: "text-neutral-400",
  MEDIUM: "text-amber-600",
  HIGH: "text-red-600",
};

const priorityLabels: Record<string, string> = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
};

export default async function TasksPage() {
  const tasks = await prisma.task.findMany({
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Tareas</h1>
        <p className="text-neutral-500">
          Planificá y seguí el trabajo de la granja. Tocá el estado para avanzarlo.
        </p>
      </div>

      <Can perm="write">
        <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-semibold">Agregar tarea</h2>
          <form action={createTask} className="grid gap-3 sm:grid-cols-2">
            <input
              name="title"
              placeholder="Título de la tarea"
              required
              className="sm:col-span-2 rounded border border-neutral-300 px-3 py-2 text-sm"
            />
            <label className="flex flex-col gap-1 text-xs text-neutral-500">
              Fecha límite
              <input
                type="date"
                name="dueDate"
                className="rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
              />
            </label>
            <select
              name="priority"
              defaultValue="MEDIUM"
              className="rounded border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="LOW">Prioridad baja</option>
              <option value="MEDIUM">Prioridad media</option>
              <option value="HIGH">Prioridad alta</option>
            </select>
            <textarea
              name="description"
              placeholder="Descripción"
              className="sm:col-span-2 rounded border border-neutral-300 px-3 py-2 text-sm"
              rows={2}
            />
            <button
              type="submit"
              className="sm:col-span-2 rounded bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
            >
              Agregar tarea
            </button>
          </form>
        </section>
      </Can>

      <section className="rounded-lg border border-neutral-200 bg-white shadow-sm">
        {tasks.length === 0 ? (
          <p className="p-4 text-sm text-neutral-500">Todavía no hay tareas. Agregá la primera arriba.</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {tasks.map((task) => (
              <li key={task.id} className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-medium">
                      {task.title}{" "}
                      <span className={`text-xs font-normal ${priorityStyles[task.priority]}`}>
                        {priorityLabels[task.priority]}
                      </span>
                    </div>
                    <div className="text-sm text-neutral-500">
                      {task.dueDate
                        ? `Vence ${new Date(task.dueDate).toLocaleDateString("es-PY")}`
                        : "Sin fecha límite"}
                    </div>
                    {task.description && (
                      <div className="text-sm text-neutral-400">{task.description}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Can perm="write">
                      <form action={cycleTaskStatus}>
                        <input type="hidden" name="id" value={task.id} />
                        <input type="hidden" name="current" value={task.status} />
                        <button
                          type="submit"
                          className={`rounded-full px-2 py-1 text-xs font-medium ${statusStyles[task.status]}`}
                        >
                          {statusLabels[task.status]}
                        </button>
                      </form>
                    </Can>
                    <Can perm="delete">
                      <form action={deleteTask}>
                        <input type="hidden" name="id" value={task.id} />
                        <DeleteButton
                          confirmMessage={`¿Eliminar la tarea "${task.title}"? Esta acción no se puede deshacer.`}
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
                      action={updateTask}
                      className="mt-2 grid gap-2 rounded border border-neutral-200 p-3 sm:grid-cols-2"
                    >
                      <input type="hidden" name="id" value={task.id} />
                      <input
                        name="title"
                        defaultValue={task.title}
                        required
                        className="sm:col-span-2 rounded border border-neutral-300 px-3 py-2 text-sm"
                      />
                      <label className="flex flex-col gap-1 text-xs text-neutral-500">
                        Fecha límite
                        <input
                          type="date"
                          name="dueDate"
                          defaultValue={toDateInput(task.dueDate)}
                          className="rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
                        />
                      </label>
                      <select
                        name="priority"
                        defaultValue={task.priority}
                        className="rounded border border-neutral-300 px-3 py-2 text-sm"
                      >
                        <option value="LOW">Prioridad baja</option>
                        <option value="MEDIUM">Prioridad media</option>
                        <option value="HIGH">Prioridad alta</option>
                      </select>
                      <textarea
                        name="description"
                        defaultValue={task.description ?? ""}
                        placeholder="Descripción"
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
