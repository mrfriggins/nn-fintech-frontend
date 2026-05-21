import { redirect } from "next/navigation";

export default function RootPage() {
  // Force the root URL to point straight to the unified dashboard
  redirect("/dashboard");
}