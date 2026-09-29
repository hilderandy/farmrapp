"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createSession, deleteSession, getCurrentUser } from "@/lib/session";
import { can, type Permission, type Role } from "@/lib/permissions";

function str(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") return undefined;
  return value.trim();
}

function date(formData: FormData, key: string): Date | undefined {
  const value = str(formData, key);
  return value ? new Date(value) : undefined;
}

// For edit forms: an empty optional field should clear the stored value,
// not leave it untouched the way `undefined` does in a Prisma update.
function strOrNull(formData: FormData, key: string): string | null {
  return str(formData, key) ?? null;
}

function dateOrNull(formData: FormData, key: string): Date | null {
  const value = str(formData, key);
  return value ? new Date(value) : null;
}

// Numeric fields from a form can't be trusted to be a valid, non-negative
// number just because the <input type="number"> looked fine in a browser —
// a hand-crafted request (or a browser with JS disabled bypassing min="0")
// can send anything. Guard against NaN/negative values corrupting sums,
// stock levels, and currency displays downstream.
function positiveNumber(formData: FormData, key: string, fallback = 0): number {
  const raw = str(formData, key);
  if (raw === undefined) return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return n;
}

// Every mutation re-checks the current user's profile on the server —
// hidden buttons in the UI are not a security boundary.
async function authorize(...permissions: Permission[]) {
  const user = await getCurrentUser();
  for (const permission of permissions) {
    if (!can(user.role, permission)) {
      throw new Error("No tenés permiso para realizar esta acción.");
    }
  }
  return user;
}

// Auth

export type LoginState = { error?: string } | undefined;

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const username = str(formData, "username");
  const password = str(formData, "password");

  if (!username || !password) {
    return { error: "Ingresá usuario y contraseña." };
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !user.active || !verifyPassword(password, user.passwordHash)) {
    return { error: "Usuario o contraseña incorrectos." };
  }

  await createSession(user.id, user.username);
  redirect("/");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}

// Crops

export async function createCrop(formData: FormData) {
  await authorize("write");
  await prisma.crop.create({
    data: {
      name: str(formData, "name") ?? "Cultivo sin título",
      location: str(formData, "location"),
      status: (str(formData, "status") as never) ?? "PLANNED",
      plantedDate: date(formData, "plantedDate"),
      harvestDate: date(formData, "harvestDate"),
      notes: str(formData, "notes"),
    },
  });
  revalidatePath("/crops");
  revalidatePath("/");
}

export async function updateCrop(formData: FormData) {
  await authorize("write");
  const id = str(formData, "id");
  if (!id) return;
  await prisma.crop.update({
    where: { id },
    data: {
      name: str(formData, "name") ?? "Cultivo sin título",
      location: strOrNull(formData, "location"),
      status: (str(formData, "status") as never) ?? "PLANNED",
      plantedDate: dateOrNull(formData, "plantedDate"),
      harvestDate: dateOrNull(formData, "harvestDate"),
      notes: strOrNull(formData, "notes"),
    },
  });
  revalidatePath("/crops");
  revalidatePath("/");
}

export async function updateCropStatus(id: string, status: string) {
  await authorize("write");
  await prisma.crop.update({ where: { id }, data: { status: status as never } });
  revalidatePath("/crops");
  revalidatePath("/");
}

export async function deleteCrop(formData: FormData) {
  await authorize("delete");
  const id = str(formData, "id");
  if (!id) return;
  await prisma.crop.delete({ where: { id } });
  revalidatePath("/crops");
  revalidatePath("/");
}

// Animals

export async function createAnimal(formData: FormData) {
  await authorize("write");
  await prisma.animal.create({
    data: {
      name: str(formData, "name") ?? "Sin nombre",
      species: str(formData, "species") ?? "Desconocida",
      breed: str(formData, "breed"),
      birthDate: date(formData, "birthDate"),
      status: (str(formData, "status") as never) ?? "ACTIVE",
      notes: str(formData, "notes"),
    },
  });
  revalidatePath("/livestock");
  revalidatePath("/");
}

export async function updateAnimal(formData: FormData) {
  await authorize("write");
  const id = str(formData, "id");
  if (!id) return;
  await prisma.animal.update({
    where: { id },
    data: {
      name: str(formData, "name") ?? "Sin nombre",
      species: str(formData, "species") ?? "Desconocida",
      breed: strOrNull(formData, "breed"),
      birthDate: dateOrNull(formData, "birthDate"),
      status: (str(formData, "status") as never) ?? "ACTIVE",
      notes: strOrNull(formData, "notes"),
    },
  });
  revalidatePath(`/livestock/${id}`);
  revalidatePath("/livestock");
}

export async function deleteAnimal(formData: FormData) {
  await authorize("delete");
  const id = str(formData, "id");
  if (!id) return;
  await prisma.animal.delete({ where: { id } });
  revalidatePath("/livestock");
  revalidatePath("/");
}

// Reproductive events

export async function createReproEvent(formData: FormData) {
  await authorize("write");
  const animalId = str(formData, "animalId");
  if (!animalId) return;
  const type = (str(formData, "type") as never) ?? "SERVICE";
  const semenBatchId = type === "SERVICE" ? str(formData, "semenBatchId") : undefined;

  await prisma.$transaction(async (tx) => {
    await tx.reproEvent.create({
      data: {
        animalId,
        type,
        date: date(formData, "date") ?? new Date(),
        notes: str(formData, "notes"),
        semenBatchId,
      },
    });
    if (semenBatchId) {
      await tx.semenBatch.update({
        where: { id: semenBatchId },
        data: { quantity: { decrement: 1 } },
      });
    }
  });

  revalidatePath(`/livestock/${animalId}`);
  revalidatePath("/livestock");
  revalidatePath("/semen");
}

export async function updateReproEvent(formData: FormData) {
  await authorize("write");
  const id = str(formData, "id");
  const animalId = str(formData, "animalId");
  if (!id) return;
  const type = (str(formData, "type") as never) ?? "SERVICE";
  const newSemenBatchId = type === "SERVICE" ? str(formData, "semenBatchId") : undefined;

  await prisma.$transaction(async (tx) => {
    const existing = await tx.reproEvent.findUnique({ where: { id } });
    if (!existing) return;

    if (existing.semenBatchId && existing.semenBatchId !== newSemenBatchId) {
      await tx.semenBatch.update({
        where: { id: existing.semenBatchId },
        data: { quantity: { increment: 1 } },
      });
    }
    if (newSemenBatchId && newSemenBatchId !== existing.semenBatchId) {
      await tx.semenBatch.update({
        where: { id: newSemenBatchId },
        data: { quantity: { decrement: 1 } },
      });
    }

    await tx.reproEvent.update({
      where: { id },
      data: {
        type,
        date: date(formData, "date") ?? new Date(),
        notes: strOrNull(formData, "notes"),
        semenBatchId: newSemenBatchId ?? null,
      },
    });
  });

  if (animalId) revalidatePath(`/livestock/${animalId}`);
  revalidatePath("/livestock");
  revalidatePath("/semen");
}

export async function deleteReproEvent(formData: FormData) {
  await authorize("delete");
  const id = str(formData, "id");
  const animalId = str(formData, "animalId");
  if (!id) return;

  await prisma.$transaction(async (tx) => {
    const event = await tx.reproEvent.delete({ where: { id } });
    if (event.semenBatchId) {
      await tx.semenBatch.update({
        where: { id: event.semenBatchId },
        data: { quantity: { increment: 1 } },
      });
    }
  });

  if (animalId) revalidatePath(`/livestock/${animalId}`);
  revalidatePath("/livestock");
  revalidatePath("/semen");
}

// Semen

export async function createSemenBatch(formData: FormData) {
  await authorize("write");
  await prisma.semenBatch.create({
    data: {
      bullName: str(formData, "bullName") ?? "Toro sin nombre",
      breed: str(formData, "breed"),
      code: str(formData, "code"),
      quantity: positiveNumber(formData, "quantity"),
      supplier: str(formData, "supplier"),
      purchaseDate: date(formData, "purchaseDate"),
      notes: str(formData, "notes"),
    },
  });
  revalidatePath("/semen");
}

export async function updateSemenBatch(formData: FormData) {
  await authorize("write");
  const id = str(formData, "id");
  if (!id) return;
  await prisma.semenBatch.update({
    where: { id },
    data: {
      bullName: str(formData, "bullName") ?? "Toro sin nombre",
      breed: strOrNull(formData, "breed"),
      code: strOrNull(formData, "code"),
      quantity: positiveNumber(formData, "quantity"),
      supplier: strOrNull(formData, "supplier"),
      purchaseDate: dateOrNull(formData, "purchaseDate"),
      notes: strOrNull(formData, "notes"),
    },
  });
  revalidatePath("/semen");
}

export async function deleteSemenBatch(formData: FormData) {
  await authorize("delete");
  const id = str(formData, "id");
  if (!id) return;
  await prisma.semenBatch.delete({ where: { id } });
  revalidatePath("/semen");
}

// Calves

export async function createCalf(formData: FormData) {
  await authorize("write");
  const motherId = str(formData, "motherId");
  if (!motherId) return;
  await prisma.calf.create({
    data: {
      motherId,
      tagNumber: str(formData, "tagNumber"),
      sex: (str(formData, "sex") as never) ?? "FEMALE",
      sireName: str(formData, "sireName"),
      birthDate: date(formData, "birthDate") ?? new Date(),
      notes: str(formData, "notes"),
    },
  });
  revalidatePath(`/livestock/${motherId}`);
  revalidatePath("/livestock");
}

export async function updateCalf(formData: FormData) {
  await authorize("write");
  const id = str(formData, "id");
  const motherId = str(formData, "motherId");
  if (!id) return;
  await prisma.calf.update({
    where: { id },
    data: {
      tagNumber: strOrNull(formData, "tagNumber"),
      sex: (str(formData, "sex") as never) ?? "FEMALE",
      sireName: strOrNull(formData, "sireName"),
      birthDate: date(formData, "birthDate") ?? new Date(),
      notes: strOrNull(formData, "notes"),
    },
  });
  if (motherId) revalidatePath(`/livestock/${motherId}`);
  revalidatePath("/livestock");
}

export async function deleteCalf(formData: FormData) {
  await authorize("delete");
  const id = str(formData, "id");
  const motherId = str(formData, "motherId");
  if (!id) return;
  await prisma.calf.delete({ where: { id } });
  if (motherId) revalidatePath(`/livestock/${motherId}`);
  revalidatePath("/livestock");
}

// Tasks

export async function createTask(formData: FormData) {
  await authorize("write");
  await prisma.task.create({
    data: {
      title: str(formData, "title") ?? "Tarea sin título",
      description: str(formData, "description"),
      dueDate: date(formData, "dueDate"),
      priority: (str(formData, "priority") as never) ?? "MEDIUM",
      status: "TODO",
    },
  });
  revalidatePath("/tasks");
  revalidatePath("/");
}

export async function updateTask(formData: FormData) {
  await authorize("write");
  const id = str(formData, "id");
  if (!id) return;
  await prisma.task.update({
    where: { id },
    data: {
      title: str(formData, "title") ?? "Tarea sin título",
      description: strOrNull(formData, "description"),
      dueDate: dateOrNull(formData, "dueDate"),
      priority: (str(formData, "priority") as never) ?? "MEDIUM",
    },
  });
  revalidatePath("/tasks");
  revalidatePath("/");
}

export async function cycleTaskStatus(formData: FormData) {
  await authorize("write");
  const id = str(formData, "id");
  const current = str(formData, "current");
  if (!id) return;
  const next = current === "TODO" ? "IN_PROGRESS" : current === "IN_PROGRESS" ? "DONE" : "TODO";
  await prisma.task.update({ where: { id }, data: { status: next as never } });
  revalidatePath("/tasks");
  revalidatePath("/");
}

export async function deleteTask(formData: FormData) {
  await authorize("delete");
  const id = str(formData, "id");
  if (!id) return;
  await prisma.task.delete({ where: { id } });
  revalidatePath("/tasks");
  revalidatePath("/");
}

// Inventory

export async function createInventoryItem(formData: FormData) {
  await authorize("write");
  await prisma.inventoryItem.create({
    data: {
      name: str(formData, "name") ?? "Ítem sin título",
      category: (str(formData, "category") as never) ?? "OTHER",
      quantity: positiveNumber(formData, "quantity"),
      unit: str(formData, "unit") ?? "unidad",
      lowStockAt: positiveNumber(formData, "lowStockAt"),
      productFamilyId: str(formData, "productFamilyId"),
    },
  });
  revalidatePath("/inventory");
  revalidatePath("/");
}

export async function updateInventoryItem(formData: FormData) {
  await authorize("write");
  const id = str(formData, "id");
  if (!id) return;
  await prisma.inventoryItem.update({
    where: { id },
    data: {
      name: str(formData, "name") ?? "Ítem sin título",
      category: (str(formData, "category") as never) ?? "OTHER",
      quantity: positiveNumber(formData, "quantity"),
      unit: str(formData, "unit") ?? "unidad",
      lowStockAt: positiveNumber(formData, "lowStockAt"),
      productFamilyId: str(formData, "productFamilyId") ?? null,
    },
  });
  revalidatePath("/inventory");
  revalidatePath("/");
}

export async function deleteInventoryItem(formData: FormData) {
  await authorize("delete");
  const id = str(formData, "id");
  if (!id) return;
  await prisma.inventoryItem.delete({ where: { id } });
  revalidatePath("/inventory");
  revalidatePath("/");
}

// Product families

export async function createProductFamily(formData: FormData) {
  await authorize("write");
  await prisma.productFamily.create({
    data: {
      name: str(formData, "name") ?? "Familia sin nombre",
      notes: str(formData, "notes"),
    },
  });
  revalidatePath("/product-families");
  revalidatePath("/inventory");
}

export async function updateProductFamily(formData: FormData) {
  await authorize("write");
  const id = str(formData, "id");
  if (!id) return;
  await prisma.productFamily.update({
    where: { id },
    data: {
      name: str(formData, "name") ?? "Familia sin nombre",
      notes: strOrNull(formData, "notes"),
    },
  });
  revalidatePath("/product-families");
  revalidatePath("/inventory");
}

export async function deleteProductFamily(formData: FormData) {
  await authorize("delete");
  const id = str(formData, "id");
  if (!id) return;
  await prisma.productFamily.delete({ where: { id } });
  revalidatePath("/product-families");
  revalidatePath("/inventory");
}

// Finance

export async function createTransaction(formData: FormData) {
  await authorize("write", "finance");
  const type = str(formData, "type") === "INCOME" ? "INCOME" : "EXPENSE";
  const contactName = str(formData, "contactName");

  await prisma.$transaction(async (tx) => {
    let contactId: string | undefined;
    if (contactName) {
      const existing = await tx.contact.findFirst({ where: { name: contactName } });
      contactId = existing
        ? existing.id
        : (
            await tx.contact.create({
              data: {
                name: contactName,
                type: (type === "INCOME" ? "CLIENT" : "SUPPLIER") as never,
              },
            })
          ).id;
    }

    await tx.transaction.create({
      data: {
        type: type as never,
        category: (str(formData, "category") as never) ?? "OTHER",
        amount: positiveNumber(formData, "amount"),
        description: str(formData, "description"),
        date: date(formData, "date") ?? new Date(),
        contactId,
        expenseConceptId: str(formData, "expenseConceptId"),
      },
    });
  });

  revalidatePath("/finance");
  revalidatePath("/contacts");
  revalidatePath("/");
}

export async function updateTransaction(formData: FormData) {
  await authorize("write", "finance");
  const id = str(formData, "id");
  if (!id) return;
  const type = str(formData, "type") === "INCOME" ? "INCOME" : "EXPENSE";
  const contactName = str(formData, "contactName");

  await prisma.$transaction(async (tx) => {
    let contactId: string | null = null;
    if (contactName) {
      const existing = await tx.contact.findFirst({ where: { name: contactName } });
      contactId = existing
        ? existing.id
        : (
            await tx.contact.create({
              data: {
                name: contactName,
                type: (type === "INCOME" ? "CLIENT" : "SUPPLIER") as never,
              },
            })
          ).id;
    }

    await tx.transaction.update({
      where: { id },
      data: {
        type: type as never,
        category: (str(formData, "category") as never) ?? "OTHER",
        amount: positiveNumber(formData, "amount"),
        description: strOrNull(formData, "description"),
        date: date(formData, "date") ?? new Date(),
        contactId,
        expenseConceptId: str(formData, "expenseConceptId") ?? null,
      },
    });
  });

  revalidatePath("/finance");
  revalidatePath("/contacts");
  revalidatePath("/");
}

export async function deleteTransaction(formData: FormData) {
  await authorize("delete", "finance");
  const id = str(formData, "id");
  if (!id) return;
  await prisma.transaction.delete({ where: { id } });
  revalidatePath("/finance");
  revalidatePath("/");
}

// Expense concepts (conceptos y subconceptos)

export async function createExpenseConcept(formData: FormData) {
  await authorize("write", "finance");
  await prisma.expenseConcept.create({
    data: {
      name: str(formData, "name") ?? "Concepto sin nombre",
      parentId: str(formData, "parentId"),
    },
  });
  revalidatePath("/expense-concepts");
  revalidatePath("/finance");
}

export async function updateExpenseConcept(formData: FormData) {
  await authorize("write", "finance");
  const id = str(formData, "id");
  if (!id) return;
  const parentId = str(formData, "parentId") ?? null;
  await prisma.expenseConcept.update({
    where: { id },
    data: {
      name: str(formData, "name") ?? "Concepto sin nombre",
      parentId: parentId === id ? null : parentId,
    },
  });
  revalidatePath("/expense-concepts");
  revalidatePath("/finance");
}

export async function deleteExpenseConcept(formData: FormData) {
  await authorize("delete", "finance");
  const id = str(formData, "id");
  if (!id) return;
  await prisma.expenseConcept.delete({ where: { id } });
  revalidatePath("/expense-concepts");
  revalidatePath("/finance");
}

// Trades (compras y ventas)

export async function createTrade(formData: FormData) {
  await authorize("write", "finance");
  const type = str(formData, "type") === "SALE" ? "SALE" : "PURCHASE";
  const contactName = str(formData, "contactName");
  const productName = str(formData, "productName");
  const description = str(formData, "description");
  const quantity = positiveNumber(formData, "quantity");
  const unitPrice = positiveNumber(formData, "unitPrice");
  const tradeDate = date(formData, "date") ?? new Date();
  const notes = str(formData, "notes");
  const amount = quantity * unitPrice;

  await prisma.$transaction(async (tx) => {
    let contactId: string | undefined;
    if (contactName) {
      const existing = await tx.contact.findFirst({ where: { name: contactName } });
      contactId = existing
        ? existing.id
        : (
            await tx.contact.create({
              data: {
                name: contactName,
                type: (type === "PURCHASE" ? "SUPPLIER" : "CLIENT") as never,
              },
            })
          ).id;
    }

    let inventoryItemId: string | undefined;
    let resolvedProductName: string | undefined;
    if (productName) {
      const existingItem = await tx.inventoryItem.findFirst({ where: { name: productName } });
      const item =
        existingItem ??
        (await tx.inventoryItem.create({
          data: { name: productName, category: "OTHER" as never, quantity: 0, unit: "unidad" },
        }));
      const updated = await tx.inventoryItem.update({
        where: { id: item.id },
        data: { quantity: { increment: type === "PURCHASE" ? quantity : -quantity } },
      });
      inventoryItemId = updated.id;
      resolvedProductName = updated.name;
    }

    const transaction = await tx.transaction.create({
      data: {
        type: (type === "PURCHASE" ? "EXPENSE" : "INCOME") as never,
        category: (type === "PURCHASE" ? "SUPPLIES" : "SALES") as never,
        amount,
        description:
          description ?? resolvedProductName ?? (type === "PURCHASE" ? "Compra" : "Venta"),
        date: tradeDate,
        contactId,
      },
    });

    await tx.trade.create({
      data: {
        type: type as never,
        contactId,
        inventoryItemId,
        description,
        quantity,
        unitPrice,
        date: tradeDate,
        notes,
        transactionId: transaction.id,
      },
    });
  });

  revalidatePath("/trades");
  revalidatePath("/inventory");
  revalidatePath("/finance");
  revalidatePath("/contacts");
  revalidatePath("/");
}

export async function updateTrade(formData: FormData) {
  await authorize("write", "finance");
  const id = str(formData, "id");
  if (!id) return;
  const type = str(formData, "type") === "SALE" ? "SALE" : "PURCHASE";
  const contactName = str(formData, "contactName");
  const productName = str(formData, "productName");
  const description = str(formData, "description");
  const quantity = positiveNumber(formData, "quantity");
  const unitPrice = positiveNumber(formData, "unitPrice");
  const tradeDate = date(formData, "date") ?? new Date();
  const notes = str(formData, "notes");
  const amount = quantity * unitPrice;

  await prisma.$transaction(async (tx) => {
    const existing = await tx.trade.findUnique({ where: { id } });
    if (!existing) return;

    // Reverse the old stock effect on the old product, if any.
    if (existing.inventoryItemId) {
      await tx.inventoryItem.update({
        where: { id: existing.inventoryItemId },
        data: {
          quantity: {
            increment: existing.type === "PURCHASE" ? -existing.quantity : existing.quantity,
          },
        },
      });
    }

    let contactId: string | null = null;
    if (contactName) {
      const existingContact = await tx.contact.findFirst({ where: { name: contactName } });
      contactId = existingContact
        ? existingContact.id
        : (
            await tx.contact.create({
              data: {
                name: contactName,
                type: (type === "PURCHASE" ? "SUPPLIER" : "CLIENT") as never,
              },
            })
          ).id;
    }

    let inventoryItemId: string | null = null;
    let resolvedProductName: string | undefined;
    if (productName) {
      const existingItem = await tx.inventoryItem.findFirst({ where: { name: productName } });
      const item =
        existingItem ??
        (await tx.inventoryItem.create({
          data: { name: productName, category: "OTHER" as never, quantity: 0, unit: "unidad" },
        }));
      const updated = await tx.inventoryItem.update({
        where: { id: item.id },
        data: { quantity: { increment: type === "PURCHASE" ? quantity : -quantity } },
      });
      inventoryItemId = updated.id;
      resolvedProductName = updated.name;
    }

    if (existing.transactionId) {
      await tx.transaction.update({
        where: { id: existing.transactionId },
        data: {
          type: (type === "PURCHASE" ? "EXPENSE" : "INCOME") as never,
          category: (type === "PURCHASE" ? "SUPPLIES" : "SALES") as never,
          amount,
          description:
            description ?? resolvedProductName ?? (type === "PURCHASE" ? "Compra" : "Venta"),
          date: tradeDate,
          contactId,
        },
      });
    }

    await tx.trade.update({
      where: { id },
      data: {
        type: type as never,
        contactId,
        inventoryItemId,
        description: description ?? null,
        quantity,
        unitPrice,
        date: tradeDate,
        notes: notes ?? null,
      },
    });
  });

  revalidatePath("/trades");
  revalidatePath("/inventory");
  revalidatePath("/finance");
  revalidatePath("/contacts");
  revalidatePath("/");
}

export async function deleteTrade(formData: FormData) {
  await authorize("delete", "finance");
  const id = str(formData, "id");
  if (!id) return;

  await prisma.$transaction(async (tx) => {
    const trade = await tx.trade.delete({ where: { id } });
    if (trade.inventoryItemId) {
      await tx.inventoryItem.update({
        where: { id: trade.inventoryItemId },
        data: {
          quantity: { increment: trade.type === "PURCHASE" ? -trade.quantity : trade.quantity },
        },
      });
    }
    if (trade.transactionId) {
      await tx.transaction.delete({ where: { id: trade.transactionId } });
    }
  });

  revalidatePath("/trades");
  revalidatePath("/inventory");
  revalidatePath("/finance");
  revalidatePath("/");
}

// Contacts (proveedores y clientes)

export async function createContact(formData: FormData) {
  await authorize("write");
  await prisma.contact.create({
    data: {
      name: str(formData, "name") ?? "Sin nombre",
      type: (str(formData, "type") as never) ?? "SUPPLIER",
      ruc: str(formData, "ruc"),
      ci: str(formData, "ci"),
      phone: str(formData, "phone"),
      email: str(formData, "email"),
      address: str(formData, "address"),
      city: str(formData, "city"),
      notes: str(formData, "notes"),
    },
  });
  revalidatePath("/contacts");
}

export async function updateContact(formData: FormData) {
  await authorize("write");
  const id = str(formData, "id");
  if (!id) return;
  await prisma.contact.update({
    where: { id },
    data: {
      name: str(formData, "name") ?? "Sin nombre",
      type: (str(formData, "type") as never) ?? "SUPPLIER",
      ruc: strOrNull(formData, "ruc"),
      ci: strOrNull(formData, "ci"),
      phone: strOrNull(formData, "phone"),
      email: strOrNull(formData, "email"),
      address: strOrNull(formData, "address"),
      city: strOrNull(formData, "city"),
      notes: strOrNull(formData, "notes"),
    },
  });
  revalidatePath("/contacts");
}

export async function deleteContact(formData: FormData) {
  await authorize("delete");
  const id = str(formData, "id");
  if (!id) return;
  await prisma.contact.delete({ where: { id } });
  revalidatePath("/contacts");
}

// Milk production

export async function createMilkRecord(formData: FormData) {
  await authorize("write");
  await prisma.milkRecord.create({
    data: {
      animalId: str(formData, "animalId"),
      session: (str(formData, "session") as never) ?? "MORNING",
      liters: positiveNumber(formData, "liters"),
      date: date(formData, "date") ?? new Date(),
      notes: str(formData, "notes"),
    },
  });
  revalidatePath("/milk");
  revalidatePath("/");
}

export async function updateMilkRecord(formData: FormData) {
  await authorize("write");
  const id = str(formData, "id");
  if (!id) return;
  await prisma.milkRecord.update({
    where: { id },
    data: {
      animalId: str(formData, "animalId") ?? null,
      session: (str(formData, "session") as never) ?? "MORNING",
      liters: positiveNumber(formData, "liters"),
      date: date(formData, "date") ?? new Date(),
      notes: strOrNull(formData, "notes"),
    },
  });
  revalidatePath("/milk");
  revalidatePath("/");
}

export async function deleteMilkRecord(formData: FormData) {
  await authorize("delete");
  const id = str(formData, "id");
  if (!id) return;
  await prisma.milkRecord.delete({ where: { id } });
  revalidatePath("/milk");
  revalidatePath("/");
}

// Users & profiles

const ROLES: Role[] = ["ADMIN", "OPERATOR", "VIEWER"];
const MIN_PASSWORD_LENGTH = 8;

function role(formData: FormData): Role | undefined {
  const value = str(formData, "role");
  return ROLES.find((r) => r === value);
}

function usersError(message: string): never {
  redirect(`/users?error=${encodeURIComponent(message)}`);
}

// The farm must never be left without someone able to manage users.
async function otherActiveAdmins(excludeId: string) {
  return prisma.user.count({
    where: { role: "ADMIN", active: true, id: { not: excludeId } },
  });
}

export async function createUser(formData: FormData) {
  await authorize("users");
  const username = str(formData, "username")?.toLowerCase();
  const password = str(formData, "password");
  const userRole = role(formData);

  if (!username || !password || !userRole) usersError("Completá usuario, contraseña y perfil.");
  if (!/^[a-z0-9._-]{3,}$/.test(username)) {
    usersError("El usuario debe tener al menos 3 caracteres: letras, números, punto, guion o guion bajo.");
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    usersError(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
  }
  if (await prisma.user.findUnique({ where: { username } })) {
    usersError(`Ya existe un usuario "${username}".`);
  }

  await prisma.user.create({
    data: {
      username,
      name: str(formData, "name") ?? null,
      passwordHash: hashPassword(password),
      role: userRole,
    },
  });
  revalidatePath("/users");
  redirect(`/users?ok=${encodeURIComponent(`Usuario "${username}" creado.`)}`);
}

export async function updateUser(formData: FormData) {
  const me = await authorize("users");
  const id = str(formData, "id");
  const userRole = role(formData);
  const active = formData.get("active") === "on";
  if (!id || !userRole) return;

  const losesAdmin = userRole !== "ADMIN" || !active;
  if (id === me.id && losesAdmin) {
    usersError("No podés quitarte el perfil de administrador ni desactivarte a vos mismo.");
  }
  if (losesAdmin && (await otherActiveAdmins(id)) === 0) {
    usersError("Tiene que quedar al menos un administrador activo.");
  }

  await prisma.user.update({
    where: { id },
    data: { name: strOrNull(formData, "name"), role: userRole, active },
  });
  revalidatePath("/users");
  redirect(`/users?ok=${encodeURIComponent("Cambios guardados.")}`);
}

export async function resetUserPassword(formData: FormData) {
  await authorize("users");
  const id = str(formData, "id");
  const password = str(formData, "password");
  if (!id) return;
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    usersError(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
  }

  await prisma.user.update({ where: { id }, data: { passwordHash: hashPassword(password) } });
  redirect(`/users?ok=${encodeURIComponent("Contraseña actualizada.")}`);
}

export async function deleteUser(formData: FormData) {
  const me = await authorize("users");
  const id = str(formData, "id");
  if (!id) return;
  if (id === me.id) usersError("No podés eliminar tu propio usuario.");
  if ((await otherActiveAdmins(id)) === 0) {
    usersError("Tiene que quedar al menos un administrador activo.");
  }

  await prisma.user.delete({ where: { id } });
  revalidatePath("/users");
  redirect(`/users?ok=${encodeURIComponent("Usuario eliminado.")}`);
}

function accountError(message: string): never {
  redirect(`/account?error=${encodeURIComponent(message)}`);
}

// Any profile, including Solo lectura, can change its own password.
export async function changeOwnPassword(formData: FormData) {
  const me = await getCurrentUser();
  const current = str(formData, "current");
  const next = str(formData, "next");
  const confirm = str(formData, "confirm");

  if (!current || !next || !confirm) accountError("Completá los tres campos.");
  if (next.length < MIN_PASSWORD_LENGTH) {
    accountError(`La nueva contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
  }
  if (next !== confirm) accountError("La nueva contraseña y su confirmación no coinciden.");

  const user = await prisma.user.findUnique({ where: { id: me.id } });
  if (!user || !verifyPassword(current, user.passwordHash)) {
    accountError("La contraseña actual no es correcta.");
  }

  await prisma.user.update({ where: { id: me.id }, data: { passwordHash: hashPassword(next) } });
  redirect(`/account?ok=${encodeURIComponent("Contraseña actualizada.")}`);
}
