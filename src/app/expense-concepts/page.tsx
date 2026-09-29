import { prisma } from "@/lib/prisma";
import { Can } from "@/app/can";
import { requirePagePermission } from "@/lib/session";
import { createExpenseConcept, updateExpenseConcept, deleteExpenseConcept } from "@/lib/actions";
import { DeleteButton } from "../delete-button";

export default async function ExpenseConceptsPage() {
  await requirePagePermission("finance");
  const concepts = await prisma.expenseConcept.findMany({
    where: { parentId: null },
    orderBy: { name: "asc" },
    include: { children: { orderBy: { name: "asc" } } },
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Conceptos y Subconceptos de Gastos</h1>
        <p className="text-neutral-500">
          Organizá tus gastos en conceptos (ej. Insumos) y subconceptos (ej. Semillas, Fertilizantes).
        </p>
      </div>

      <Can perm="write">
        <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-semibold">Agregar concepto o subconcepto</h2>
          <form action={createExpenseConcept} className="grid gap-3 sm:grid-cols-2">
            <input
              name="name"
              placeholder="Nombre (ej. Insumos, o Semillas)"
              required
              className="rounded border border-neutral-300 px-3 py-2 text-sm"
            />
            <select
              name="parentId"
              defaultValue=""
              className="rounded border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="">Es un concepto principal (sin superior)</option>
              {concepts.map((c) => (
                <option key={c.id} value={c.id}>
                  Subconcepto de: {c.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="sm:col-span-2 rounded bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
            >
              Agregar
            </button>
          </form>
        </section>
      </Can>

      <section className="rounded-lg border border-neutral-200 bg-white shadow-sm">
        {concepts.length === 0 ? (
          <p className="p-4 text-sm text-neutral-500">
            Todavía no hay conceptos. Agregá el primero arriba.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {concepts.map((c) => (
              <li key={c.id} className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="font-medium">{c.name}</div>
                  <div className="flex items-center gap-3">
                    <Can perm="delete">
                      <form action={deleteExpenseConcept}>
                        <input type="hidden" name="id" value={c.id} />
                        <DeleteButton
                          confirmMessage={
                            c.children.length > 0
                              ? `¿Eliminar "${c.name}"? Esto también va a borrar sus ${c.children.length} subconcepto(s). Esta acción no se puede deshacer.`
                              : `¿Eliminar "${c.name}"? Esta acción no se puede deshacer.`
                          }
                        />
                      </form>
                    </Can>
                  </div>
                </div>
                <Can perm="write">
                  <details className="mt-1">
                    <summary className="cursor-pointer text-sm text-green-700 hover:underline">
                      Editar
                    </summary>
                    <form
                      action={updateExpenseConcept}
                      className="mt-2 grid gap-2 rounded border border-neutral-200 p-3 sm:grid-cols-2"
                    >
                      <input type="hidden" name="id" value={c.id} />
                      <input
                        name="name"
                        defaultValue={c.name}
                        required
                        className="rounded border border-neutral-300 px-3 py-2 text-sm"
                      />
                      <button
                        type="submit"
                        className="rounded bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
                      >
                        Guardar cambios
                      </button>
                    </form>
                  </details>
                </Can>
                {c.children.length > 0 && (
                  <ul className="mt-2 flex flex-col gap-2 border-l-2 border-neutral-100 pl-4">
                    {c.children.map((sub) => (
                      <li key={sub.id}>
                        <div className="flex items-center justify-between gap-4">
                          <div className="text-sm text-neutral-600">↳ {sub.name}</div>
                          <Can perm="delete">
                            <form action={deleteExpenseConcept}>
                              <input type="hidden" name="id" value={sub.id} />
                              <DeleteButton
                                confirmMessage={`¿Eliminar el subconcepto "${sub.name}"? Esta acción no se puede deshacer.`}
                              />
                            </form>
                          </Can>
                        </div>
                        <Can perm="write">
                          <details className="mt-1">
                            <summary className="cursor-pointer text-xs text-green-700 hover:underline">
                              Editar
                            </summary>
                            <form
                              action={updateExpenseConcept}
                              className="mt-2 grid gap-2 rounded border border-neutral-200 p-3 sm:grid-cols-2"
                            >
                              <input type="hidden" name="id" value={sub.id} />
                              <input
                                name="name"
                                defaultValue={sub.name}
                                required
                                className="rounded border border-neutral-300 px-3 py-2 text-sm"
                              />
                              <select
                                name="parentId"
                                defaultValue={c.id}
                                className="rounded border border-neutral-300 px-3 py-2 text-sm"
                              >
                                {concepts.map((opt) => (
                                  <option key={opt.id} value={opt.id}>
                                    Subconcepto de: {opt.name}
                                  </option>
                                ))}
                              </select>
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
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
