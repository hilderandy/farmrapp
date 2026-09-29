import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4">
      <div className="mb-6 text-center">
        <div className="text-2xl font-semibold text-green-700">🌾 Farmr</div>
        <p className="text-neutral-500">Iniciá sesión para continuar</p>
      </div>
      <LoginForm />
    </div>
  );
}
