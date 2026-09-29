import { prisma } from "@/lib/prisma";
import { Can } from "@/app/can";
import { createContact, updateContact, deleteContact } from "@/lib/actions";
import { DeleteButton } from "../delete-button";

const typeLabels: Record<string, string> = {
  SUPPLIER: "Proveedor",
  CLIENT: "Cliente",
  BOTH: "Proveedor y Cliente",
};

const typeStyles: Record<string, string> = {
  SUPPLIER: "bg-amber-100 text-amber-800",
  CLIENT: "bg-blue-100 text-blue-800",
  BOTH: "bg-purple-100 text-purple-800",
};

export default async function ContactsPage() {
  const contacts = await prisma.contact.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Proveedores y Clientes</h1>
        <p className="text-neutral-500">
          Registrá los proveedores y clientes de la granja, con sus datos fiscales.
        </p>
      </div>

      <Can perm="write">
        <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-semibold">Agregar proveedor o cliente</h2>
          <form action={createContact} className="grid gap-3 sm:grid-cols-2">
            <input
              name="name"
              placeholder="Nombre / Razón social"
              required
              className="sm:col-span-2 rounded border border-neutral-300 px-3 py-2 text-sm"
            />
            <select
              name="type"
              defaultValue="SUPPLIER"
              className="rounded border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="SUPPLIER">Proveedor</option>
              <option value="CLIENT">Cliente</option>
              <option value="BOTH">Proveedor y Cliente</option>
            </select>
            <input
              name="ruc"
              placeholder="RUC (ej. 80012345-6)"
              className="rounded border border-neutral-300 px-3 py-2 text-sm"
            />
            <input
              name="ci"
              placeholder="Cédula de identidad"
              className="rounded border border-neutral-300 px-3 py-2 text-sm"
            />
            <input
              name="phone"
              placeholder="Teléfono"
              className="rounded border border-neutral-300 px-3 py-2 text-sm"
            />
            <input
              name="email"
              type="email"
              placeholder="Correo electrónico"
              className="rounded border border-neutral-300 px-3 py-2 text-sm"
            />
            <input
              name="city"
              placeholder="Ciudad / Departamento"
              className="rounded border border-neutral-300 px-3 py-2 text-sm"
            />
            <input
              name="address"
              placeholder="Dirección"
              className="sm:col-span-2 rounded border border-neutral-300 px-3 py-2 text-sm"
            />
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
              Agregar
            </button>
          </form>
        </section>
      </Can>

      <section className="rounded-lg border border-neutral-200 bg-white shadow-sm">
        {contacts.length === 0 ? (
          <p className="p-4 text-sm text-neutral-500">
            Todavía no hay proveedores ni clientes. Agregá el primero arriba.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {contacts.map((c) => (
              <li key={c.id} className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-sm text-neutral-500">
                      {c.ruc && `RUC ${c.ruc}`}
                      {c.ruc && c.ci && " · "}
                      {c.ci && `CI ${c.ci}`}
                      {(c.ruc || c.ci) && (c.phone || c.city) && " · "}
                      {c.phone}
                      {c.phone && c.city && " · "}
                      {c.city}
                    </div>
                    {c.address && <div className="text-sm text-neutral-400">{c.address}</div>}
                    {c.email && <div className="text-sm text-neutral-400">{c.email}</div>}
                    {c.notes && <div className="text-sm text-neutral-400">{c.notes}</div>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${typeStyles[c.type]}`}
                    >
                      {typeLabels[c.type]}
                    </span>
                    <Can perm="delete">
                      <form action={deleteContact}>
                        <input type="hidden" name="id" value={c.id} />
                        <DeleteButton
                          confirmMessage={`¿Eliminar a "${c.name}"? Esta acción no se puede deshacer.`}
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
                      action={updateContact}
                      className="mt-2 grid gap-2 rounded border border-neutral-200 p-3 sm:grid-cols-2"
                    >
                      <input type="hidden" name="id" value={c.id} />
                      <input
                        name="name"
                        defaultValue={c.name}
                        required
                        className="sm:col-span-2 rounded border border-neutral-300 px-3 py-2 text-sm"
                      />
                      <select
                        name="type"
                        defaultValue={c.type}
                        className="rounded border border-neutral-300 px-3 py-2 text-sm"
                      >
                        <option value="SUPPLIER">Proveedor</option>
                        <option value="CLIENT">Cliente</option>
                        <option value="BOTH">Proveedor y Cliente</option>
                      </select>
                      <input
                        name="ruc"
                        defaultValue={c.ruc ?? ""}
                        placeholder="RUC"
                        className="rounded border border-neutral-300 px-3 py-2 text-sm"
                      />
                      <input
                        name="ci"
                        defaultValue={c.ci ?? ""}
                        placeholder="Cédula de identidad"
                        className="rounded border border-neutral-300 px-3 py-2 text-sm"
                      />
                      <input
                        name="phone"
                        defaultValue={c.phone ?? ""}
                        placeholder="Teléfono"
                        className="rounded border border-neutral-300 px-3 py-2 text-sm"
                      />
                      <input
                        name="email"
                        type="email"
                        defaultValue={c.email ?? ""}
                        placeholder="Correo electrónico"
                        className="rounded border border-neutral-300 px-3 py-2 text-sm"
                      />
                      <input
                        name="city"
                        defaultValue={c.city ?? ""}
                        placeholder="Ciudad / Departamento"
                        className="rounded border border-neutral-300 px-3 py-2 text-sm"
                      />
                      <input
                        name="address"
                        defaultValue={c.address ?? ""}
                        placeholder="Dirección"
                        className="sm:col-span-2 rounded border border-neutral-300 px-3 py-2 text-sm"
                      />
                      <textarea
                        name="notes"
                        defaultValue={c.notes ?? ""}
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
