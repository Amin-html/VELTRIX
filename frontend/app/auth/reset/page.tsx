import ResetPassword from "@/components/ResetPassword";

export const metadata = { title: "Новый пароль — VELTRIX" };

export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<{ uid?: string; token?: string }>;
}) {
  const { uid, token } = await searchParams;
  return <ResetPassword uid={uid} token={token} />;
}