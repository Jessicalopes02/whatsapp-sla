import { AppSidebar } from "./AppSidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-white lg:flex">
      <AppSidebar />

      <div className="min-w-0 flex-1">
        {children}
      </div>
    </div>
  );
}