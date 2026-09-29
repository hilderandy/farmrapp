import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const [cropCount, animalCount, openTasks, lowStockItems, upcomingTasks] =
    await Promise.all([
      prisma.crop.count(),
      prisma.animal.count({ where: { status: "ACTIVE" } }),
      prisma.task.count({ where: { status: { not: "DONE" } } }),
      prisma.inventoryItem.findMany({
        orderBy: { name: "asc" },
      }),
      prisma.task.findMany({
        where: { status: { not: "DONE" } },
        orderBy: { dueDate: "asc" },
        take: 5,
      }),
    ]);

  const lowStock = lowStockItems.filter((item) => item.quantity <= item.lowStockAt);

  const stats = [
    { label: "Crops", value: cropCount, href: "/crops" },
    { label: "Active livestock", value: animalCount, href: "/livestock" },
    { label: "Open tasks", value: openTasks, href: "/tasks" },
    { label: "Low stock items", value: lowStock.length, href: "/inventory" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Farm dashboard</h1>
        <p className="text-neutral-500">
          A quick overview of what&apos;s happening on the farm.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm transition hover:border-green-300 hover:shadow"
          >
            <div className="text-2xl font-semibold text-green-700">
              {stat.value}
            </div>
            <div className="text-sm text-neutral-500">{stat.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-semibold">Upcoming tasks</h2>
          {upcomingTasks.length === 0 ? (
            <p className="text-sm text-neutral-500">No open tasks. Nice work!</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {upcomingTasks.map((task) => (
                <li key={task.id} className="flex items-center justify-between text-sm">
                  <span>{task.title}</span>
                  <span className="text-neutral-400">
                    {task.dueDate
                      ? new Date(task.dueDate).toLocaleDateString()
                      : "No due date"}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/tasks" className="mt-3 inline-block text-sm text-green-700 hover:underline">
            View all tasks →
          </Link>
        </section>

        <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-semibold">Low stock alerts</h2>
          {lowStock.length === 0 ? (
            <p className="text-sm text-neutral-500">Inventory levels look healthy.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {lowStock.map((item) => (
                <li key={item.id} className="flex items-center justify-between text-sm">
                  <span>{item.name}</span>
                  <span className="text-red-600">
                    {item.quantity} {item.unit} left
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/inventory" className="mt-3 inline-block text-sm text-green-700 hover:underline">
            View inventory →
          </Link>
        </section>
      </div>
    </div>
  );
}
