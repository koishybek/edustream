import { redirect } from "next/navigation";

export default function Home() {
  // Phase 4: redirect to /dashboard when an admin session exists.
  redirect("/login");
}
