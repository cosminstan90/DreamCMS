import { auth } from "@/auth"
import { Sidebar } from "@/components/admin/Sidebar"
import { Header } from "@/components/admin/Header"
import { redirect } from "next/navigation"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 flex">
      <Sidebar />
      <div className="flex-1 ml-[240px] flex flex-col min-h-screen">
        <Header user={session.user} />
        <main className="p-8 flex-1 bg-[#0f172a]">
          {children}
        </main>
      </div>
    </div>
  )
}
