import Sidebar from "@/components/layout/Sidebar";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar role="CUSTOMER" />
      <main className="flex-1 p-8 bg-gray-50">{children}</main>
    </div>
  );
}
