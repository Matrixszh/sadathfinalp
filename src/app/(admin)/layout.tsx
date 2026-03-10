import Sidebar from "@/components/Sidebar";
import PageTransition from "@/components/PageTransition";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-muted/30">
      <Sidebar />
      <main className="flex-1 md:ml-64 flex flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-sm shadow-sm md:hidden">
            <div className="font-bold text-lg">Crodus AI</div>
            {/* Mobile menu trigger would go here */}
        </header>
        <div className="flex-1 p-8 overflow-y-auto">
            <div className="mx-auto max-w-6xl">
              <PageTransition>
                {children}
              </PageTransition>
            </div>
        </div>
      </main>
    </div>
  );
}
