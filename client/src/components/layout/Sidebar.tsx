import { useState } from "react";
import { NavLink } from "react-router-dom";
import { ChevronsLeft, ChevronsRight, LucideIcon } from "lucide-react";

export interface SidebarItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

export interface SidebarSection {
  title?: string;
  items: SidebarItem[];
}

export function Sidebar({ sections }: { sections: SidebarSection[] }) {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("veyza-sidebar-collapsed") === "true");

  function toggle() {
    setCollapsed((c) => {
      localStorage.setItem("veyza-sidebar-collapsed", String(!c));
      return !c;
    });
  }

  return (
    <aside
      className={`sticky top-16 hidden h-[calc(100vh-4rem)] shrink-0 flex-col border-r border-border bg-white py-4 transition-all lg:flex ${
        collapsed ? "w-[68px]" : "w-64"
      }`}
    >
      <div className="flex-1 space-y-6 overflow-y-auto px-3">
        {sections.map((section, i) => (
          <div key={i}>
            {section.title && !collapsed && (
              <p className="mb-1.5 px-3 text-xs font-semibold uppercase tracking-wide text-muted">{section.title}</p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.to} className="group relative">
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive ? "bg-primary-light text-primary" : "text-text hover:bg-bg"
                      } ${collapsed ? "justify-center" : ""}`
                    }
                  >
                    <item.icon size={19} className="shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                  {collapsed && (
                    <span className="pointer-events-none absolute left-full top-1/2 z-30 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-xs text-white opacity-0 shadow-pop group-hover:opacity-100">
                      {item.label}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="px-3">
        <button
          onClick={toggle}
          aria-label={collapsed ? "Agrandir le menu" : "Réduire le menu"}
          className="flex w-full items-center justify-center gap-2 rounded-md py-2 text-muted hover:bg-bg"
        >
          {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
        </button>
      </div>
    </aside>
  );
}
