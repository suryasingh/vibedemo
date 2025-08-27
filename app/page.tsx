import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Redirect to dashboard if logged in, otherwise to login
  if (session?.user) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
