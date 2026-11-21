import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in · Trilho" };

export default function LoginPage() {
  return (
    <main className="mx-auto w-full max-w-sm px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Log in</h1>
      <LoginForm />
    </main>
  );
}
