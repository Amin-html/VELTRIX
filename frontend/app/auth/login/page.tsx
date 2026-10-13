import AuthForm from "@/components/AuthForm";

export const metadata = { title: "Вход — VELTRIX" };

export default function LoginPage() {
  return <AuthForm mode="login" />;
}