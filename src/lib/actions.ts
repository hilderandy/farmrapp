"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

function str(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") return undefined;
  return value.trim();
}

function date(formData: FormData, key: string): Date | undefined {
  const value = str(formData, key);
  return value ? new Date(value) : undefined;
}

// Crops

export async function createCrop(formData: FormData) {
  await prisma.crop.create({
    data: {
      name: str(formData, "name") ?? "Untitled crop",
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

export async function updateCropStatus(id: string, status: string) {
  await prisma.crop.update({ where: { id }, data: { status: status as never } });
  revalidatePath("/crops");
  revalidatePath("/");
}

export async function deleteCrop(formData: FormData) {
  const id = str(formData, "id");
  if (!id) return;
  await prisma.crop.delete({ where: { id } });
  revalidatePath("/crops");
  revalidatePath("/");
}

// Animals

export async function createAnimal(formData: FormData) {
  await prisma.animal.create({
    data: {
      name: str(formData, "name") ?? "Unnamed",
      species: str(formData, "species") ?? "Unknown",
      breed: str(formData, "breed"),
      birthDate: date(formData, "birthDate"),
      status: (str(formData, "status") as never) ?? "ACTIVE",
      notes: str(formData, "notes"),
    },
  });
  revalidatePath("/livestock");
  revalidatePath("/");
}

export async function deleteAnimal(formData: FormData) {
  const id = str(formData, "id");
  if (!id) return;
  await prisma.animal.delete({ where: { id } });
  revalidatePath("/livestock");
  revalidatePath("/");
}

// Tasks

export async function createTask(formData: FormData) {
  await prisma.task.create({
    data: {
      title: str(formData, "title") ?? "Untitled task",
      description: str(formData, "description"),
      dueDate: date(formData, "dueDate"),
      priority: (str(formData, "priority") as never) ?? "MEDIUM",
      status: "TODO",
    },
  });
  revalidatePath("/tasks");
  revalidatePath("/");
}

export async function cycleTaskStatus(formData: FormData) {
  const id = str(formData, "id");
  const current = str(formData, "current");
  if (!id) return;
  const next = current === "TODO" ? "IN_PROGRESS" : current === "IN_PROGRESS" ? "DONE" : "TODO";
  await prisma.task.update({ where: { id }, data: { status: next as never } });
  revalidatePath("/tasks");
  revalidatePath("/");
}

export async function deleteTask(formData: FormData) {
  const id = str(formData, "id");
  if (!id) return;
  await prisma.task.delete({ where: { id } });
  revalidatePath("/tasks");
  revalidatePath("/");
}

// Inventory

export async function createInventoryItem(formData: FormData) {
  await prisma.inventoryItem.create({
    data: {
      name: str(formData, "name") ?? "Untitled item",
      category: (str(formData, "category") as never) ?? "OTHER",
      quantity: Number(str(formData, "quantity") ?? "0"),
      unit: str(formData, "unit") ?? "unit",
      lowStockAt: Number(str(formData, "lowStockAt") ?? "0"),
    },
  });
  revalidatePath("/inventory");
  revalidatePath("/");
}

export async function deleteInventoryItem(formData: FormData) {
  const id = str(formData, "id");
  if (!id) return;
  await prisma.inventoryItem.delete({ where: { id } });
  revalidatePath("/inventory");
  revalidatePath("/");
}
