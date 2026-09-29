import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { can } from "@/lib/permissions";

const currency = new Intl.NumberFormat("es-PY", {
  style: "currency",
  currency: "PYG",
});

export default async function DashboardPage() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const user = await getCurrentUser();
  const showFinance = can(user.role, "finance");

  const [
    cropCount,
    animalCount,
    openTasks,
    lowStockItems,
    upcomingTasks,
    transactions,
    milkToday,
  ] = await Promise.all([
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
      showFinance ? prisma.transaction.findMany() : Promise.resolve([]),
      prisma.milkRecord.aggregate({
        _sum: { liters: true },
        where: { date: { gte: todayStart } },
      }),
    ]);

  const lowStock = lowStockItems.filter((item) => item.quantity <= item.lowStockAt);
  const balance = transactions.reduce(
    (sum, t) => sum + (t.type === "INCOME" ? t.amount : -t.amount),
    0,
  );

  const stats = [
    { label: "Cultivos", value: cropCount, href: "/crops" },
    { label: "Ganado activo", value: animalCount, href: "/livestock" },
    {
      label: "Leche hoy",
      value: `${(milkToday._sum.liters ?? 0).toLocaleString("es-PY")} L`,
      href: "/milk",
    },
    { label: "Tareas pendientes", value: openTasks, href: "/tasks" },
    { label: "Ítems con poco stock", value: lowStock.length, href: "/inventory" },
    ...(showFinance
      ? [{ label: "Balance", value: currency.format(balance), href: "/finance" }]
      : []),
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Panel de la granja</h1>
        <p className="text-neutral-500">
          Un vistazo rápido a lo que está pasando en la granja.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
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
          <h2 className="mb-3 font-semibold">Próximas tareas</h2>
          {upcomingTasks.length === 0 ? (
            <p className="text-sm text-neutral-500">No hay tareas pendientes. ¡Buen trabajo!</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {upcomingTasks.map((task) => (
                <li key={task.id} className="flex items-center justify-between text-sm">
                  <span>{task.title}</span>
                  <span className="text-neutral-400">
                    {task.dueDate
                      ? new Date(task.dueDate).toLocaleDateString("es-PY")
                      : "Sin fecha límite"}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/tasks" className="mt-3 inline-block text-sm text-green-700 hover:underline">
            Ver todas las tareas →
          </Link>
        </section>

        <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-semibold">Alertas de stock bajo</h2>
          {lowStock.length === 0 ? (
            <p className="text-sm text-neutral-500">Los niveles de inventario están bien.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {lowStock.map((item) => (
                <li key={item.id} className="flex items-center justify-between text-sm">
                  <span>{item.name}</span>
                  <span className="text-red-600">
                    quedan {item.quantity} {item.unit}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/inventory" className="mt-3 inline-block text-sm text-green-700 hover:underline">
            Ver inventario →
          </Link>
        </section>
      </div>
    </div>
  );
}
