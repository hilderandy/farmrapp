import { prisma } from "@/lib/prisma";
import { createTask, cycleTaskStatus, deleteTask } from "@/lib/actions";

const statusStyles: Record<string, string> = {
  TODO: "bg-neutral-100 text-neutral-700",
  IN_PROGRESS: "bg-amber-100 text-amber-800",
  DONE: "bg-green-100 text-green-800",
};

const priorityStyles: Record<string, string> = {
  LOW: "text-neutral-400",
  MEDIUM: "text-amber-600",
  HIGH: "text-red-600",
};

export default async function TasksPage() {
  const tasks = await prisma.task.findMany({
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Tasks</h1>
        <p className="text-neutral-500">Plan and track farm work. Click status to advance it.</p>
      </div>

      <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-semibold">Add a task</h2>
        <form action={createTask} className="grid gap-3 sm:grid-cols-2">
          <input
            name="title"
            placeholder="Task title"
            required
            className="sm:col-span-2 rounded border border-neutral-300 px-3 py-2 text-sm"
          />
          <label className="flex flex-col gap-1 text-xs text-neutral-500">
            Due date
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
            <option value="LOW">Low priority</option>
            <option value="MEDIUM">Medium priority</option>
            <option value="HIGH">High priority</option>
          </select>
          <textarea
            name="description"
            placeholder="Description"
            className="sm:col-span-2 rounded border border-neutral-300 px-3 py-2 text-sm"
            rows={2}
          />
          <button
            type="submit"
            className="sm:col-span-2 rounded bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
          >
            Add task
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white shadow-sm">
        {tasks.length === 0 ? (
          <p className="p-4 text-sm text-neutral-500">No tasks yet. Add your first one above.</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {tasks.map((task) => (
              <li key={task.id} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <div className="font-medium">
                    {task.title}{" "}
                    <span className={`text-xs font-normal ${priorityStyles[task.priority]}`}>
                      {task.priority}
                    </span>
                  </div>
                  <div className="text-sm text-neutral-500">
                    {task.dueDate
                      ? `Due ${new Date(task.dueDate).toLocaleDateString()}`
                      : "No due date"}
                  </div>
                  {task.description && (
                    <div className="text-sm text-neutral-400">{task.description}</div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <form action={cycleTaskStatus}>
                    <input type="hidden" name="id" value={task.id} />
                    <input type="hidden" name="current" value={task.status} />
                    <button
                      type="submit"
                      className={`rounded-full px-2 py-1 text-xs font-medium ${statusStyles[task.status]}`}
                    >
                      {task.status.replace("_", " ")}
                    </button>
                  </form>
                  <form action={deleteTask}>
                    <input type="hidden" name="id" value={task.id} />
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
