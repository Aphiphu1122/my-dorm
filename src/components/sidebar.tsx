"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import "remixicon/fonts/remixicon.css";

type Role = "Admin" | "user";

const roleLinks: Record<Role, { href: string; label: string; icon: string }[]> = {
  Admin: [
    { href: "/admin/dashboard", label: "Dashboard", icon: "ri-pie-chart-line" },
    { href: "/admin/rooms", label: "Room Management", icon: "ri-home-9-line" },
    { href: "/admin/users", label: "Tenant Management", icon: "ri-team-line" },
    { href: "/admin/Finance", label: "Finance Management", icon: "ri-refund-2-line" },
    { href: "/admin/Repair", label: "Repair Management", icon: "ri-tools-line" },
    { href: "/admin/report", label: "Report", icon: "ri-line-chart-line" },
    { href: "/admin/settings", label: "Settings", icon: "ri-settings-3-line" },
  ],
  user: [
    { href: "/tenant/home", label: "Home", icon: "ri-home-4-line" },
    { href: "/Payment_bank", label: "Payment", icon: "ri-refund-2-line" },
    { href: "/maintenance", label: "Repair Requests", icon: "ri-tools-line" },
    { href: "/rules", label: "Rules & Contract", icon: "ri-file-text-line" },
  ],
};

interface SidebarProps {
  role: Role;
}

const Sidebar: React.FC<SidebarProps> = ({ role }) => {
  const pathname = usePathname();

  const links = roleLinks[role];

  const headerTitle = role === "Admin" ? "Admin Tools" : "Tenant Tools";

  return (
    <aside className="w-64 min-h-screen bg-white  px-4 py-6">
      <h2 className="text-2xl font-bold text-[#0F3659] mb-6 flex items-center gap-4">
        <span
          className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-[#0F3659] bg-[#0F3659]"
          aria-hidden="true"
        >
          <i className="ri-home-heart-fill text-white text-xl"></i>
        </span>
        Dorm
      </h2>

      <h3 className="text-[#0F3659] font-bold mt-2 mb-3">
        {headerTitle}
      </h3>

      <nav className="space-y-1">
        {links.map(({ href, label, icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link key={href} href={href}>
              <div
                className={`flex items-center gap-2 px-3 py-2 mb-2 rounded-lg cursor-pointer ${
                  isActive
                    ? "bg-[#0F3659] text-white"
                    : "text-gray-700 hover:bg-blue-100"
                }`}
              >
                <i className={`${icon} text-lg`}></i>
                <span>{label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <h3 className="text-[#0F3659] font-bold mt-5 mb-3">Authentication</h3>
      <button className="flex items-center px-3 py-2 text-gray-700 hover:text-[#0F3659] gap-2">
        <i className="ri-logout-circle-line text-lg"></i> Logout
      </button>
    </aside>
  );
};

export default Sidebar;
