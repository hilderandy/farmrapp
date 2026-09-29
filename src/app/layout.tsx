import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { OfflineBanner } from "./offline-banner";
import { NavDropdown } from "./nav-dropdown";
import { getCurrentUser, getSession } from "@/lib/session";
import { can, roleLabels, type Permission } from "@/lib/permissions";
import { logout } from "@/lib/actions";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Farmr — Gestión de Granjas",
  description: "Controlá cultivos, ganado, tareas e inventario de tu granja.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Farmr",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#15803d",
};

type NavItem = { href: string; label: string; perm?: Permission };

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Producción",
    items: [
      { href: "/crops", label: "Cultivos" },
      { href: "/livestock", label: "Ganado" },
      { href: "/milk", label: "Leche" },
      { href: "/semen", label: "Semen" },
    ],
  },
  {
    label: "Inventario",
    items: [
      { href: "/inventory", label: "Inventario" },
      { href: "/product-families", label: "Familias" },
    ],
  },
  {
    label: "Finanzas",
    items: [
      { href: "/finance", label: "Finanzas", perm: "finance" },
      { href: "/trades", label: "Compras y Ventas", perm: "finance" },
      { href: "/expense-concepts", label: "Conceptos", perm: "finance" },
      { href: "/contacts", label: "Contactos" },
    ],
  },
];

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await getSession();
  const user = session ? await getCurrentUser() : null;
  const visibleGroups = user
    ? navGroups
        .map((group) => ({
          label: group.label,
          items: group.items
            .filter((item) => !item.perm || can(user.role, item.perm))
            .map(({ href, label }) => ({ href, label })),
        }))
        .filter((group) => group.items.length > 0)
    : [];

  return (
    <html
      lang="es-PY"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900">
        <OfflineBanner />
        <header className="border-b border-neutral-200 bg-white">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <Link href="/" className="text-lg font-semibold text-green-700">
                🌾 Farmr
              </Link>
              {user && (
                <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-neutral-600">
                  <Link href="/" className="hover:text-green-700">
                    Inicio
                  </Link>
                  {visibleGroups.map((group) => (
                    <NavDropdown key={group.label} label={group.label} items={group.items} />
                  ))}
                  <Link href="/tasks" className="hover:text-green-700">
                    Tareas
                  </Link>
                  {can(user.role, "users") && (
                    <Link href="/users" className="hover:text-green-700">
                      Usuarios
                    </Link>
                  )}
                </nav>
              )}
            </div>
            {user && (
              <div className="flex items-center gap-3 text-sm">
                <Link href="/account" className="text-neutral-600 hover:text-green-700">
                  {user.name ?? user.username}{" "}
                  <span className="text-xs text-neutral-400">({roleLabels[user.role]})</span>
                </Link>
                <form action={logout}>
                  <button type="submit" className="text-neutral-500 hover:text-red-600">
                    Cerrar sesión
                  </button>
                </form>
              </div>
            )}
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
