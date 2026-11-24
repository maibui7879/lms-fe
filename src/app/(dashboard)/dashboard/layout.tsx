export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen">
      <aside className="border-b px-6 py-4">LMS Dashboard</aside>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
