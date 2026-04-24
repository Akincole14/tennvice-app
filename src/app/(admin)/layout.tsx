import Sidebar from "@/components/layout/Sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar role="ADMIN" />
      <main className="flex-1 p-8 bg-gray-50">{children}</main>
    </div>
  );
}
