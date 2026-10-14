import { redirect } from "next/navigation";

export default function PartsPage() {
  redirect("/catalog?category=parts");
}