import type { Metadata } from "next";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Register · Trilho" };

export default function RegisterPage() {
  return (
    <main className="mx-auto w-full max-w-sm px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Create your account</h1>
      <RegisterForm />
    </main>
  );
}
