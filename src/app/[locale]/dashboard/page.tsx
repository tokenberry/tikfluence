import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

const dashboardMap: Record<string, string> = {
  CREATOR: "/creator",
  NETWORK: "/network",
  BRAND: "/brand",
  ADMIN: "/admin/users",
  AGENCY: "/agency",
  ACCOUNT_MANAGER: "/account-manager/clients",
}

export default async function DashboardRedirectPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const role = session.user.role
  if (role && dashboardMap[role]) {
    redirect(dashboardMap[role])
  }

  redirect("/")
}
