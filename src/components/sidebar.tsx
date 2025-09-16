"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import "remixicon/fonts/remixicon.css";

type Role = "admin" | "user";

const roleLinks: Record<Role, { href: string; label: string; icon: string }[]> = {
  admin: [
    { href: "/admin/dashboard", label: "แดชบอร์ด",        icon: "ri-pie-chart-line" },
    { href: "/admin/tenants",   label: "จัดการผู้เช่า",    icon: "ri-team-line" },
    { href: "/admin/rooms",     label: "จัดการห้องพัก",    icon: "ri-home-9-line" },
    { href: "/admin/bills",     label: "จัดการบิล",       icon: "ri-refund-2-line" },
    { href: "/admin/maintenance", label: "คำขอแจ้งซ่อม", icon: "ri-tools-line" },
    { href: "/admin/moveout",   label: "คำขอย้ายออก",     icon: "ri-door-open-line" },
  ],
  user: [
    { href: "/home",        label: "หน้าหลัก",          icon: "ri-home-4-line" },
    { href: "/profile",     label: "โปรไฟล์",           icon: "ri-user-settings-line" },
    { href: "/bills",       label: "บิลและการชำระเงิน",  icon: "ri-refund-2-line" },
    { href: "/maintenance", label: "แจ้งซ่อม",          icon: "ri-tools-line" },
    { href: "/moveout",     label: "แจ้งย้ายออก",        icon: "ri-door-open-line" },
  ],
};

interface SidebarProps {
  role: Role;
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const links = roleLinks[role];
  const headerTitle = role === "admin" ? "เมนูผู้ดูแล" : "เมนูผู้เช่า";

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/logout", { credentials: "include" });
      if (res.ok) {
        toast.success("ออกจากระบบเรียบร้อยแล้ว");
        setTimeout(() => router.push("/"), 900);
      } else {
        toast.error("เกิดข้อผิดพลาดในการออกจากระบบ");
      }
    } catch (err) {
      console.error("Logout failed:", err);
      toast.error("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์");
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <aside
        className="
          w-64 h-screen sticky top-0
          bg-white/95 backdrop-blur
          border-r border-gray-200
          flex flex-col
        "
        aria-label="แถบเมนูด้านข้าง"
      >
        {/* Brand */}
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#0F3659] via-indigo-600 to-sky-500 text-white grid place-items-center shadow-sm">
              <i className="ri-home-heart-fill text-xl" aria-hidden />
            </div>
            <div>
              <div className="text-lg font-extrabold text-[#0F3659] leading-5">หอพัก</div>
              <div className="text-[11px] text-gray-500">ระบบจัดการ</div>
            </div>
          </div>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-[#0F3659]" />
            <span className="text-xs font-medium text-[#0F3659]">{headerTitle}</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="mt-3 px-3 overflow-y-auto">
          <ul className="space-y-1.5">
            {links.map(({ href, label, icon }) => {
              const isActive = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={isActive ? "page" : undefined}
                    className={`
                      group relative flex items-center gap-3
                      rounded-xl px-3 py-2.5
                      transition-all duration-150 outline-none
                      ${isActive
                        ? "bg-[#0F3659] text-white shadow-sm"
                        : "text-gray-700 hover:bg-gray-100 focus:bg-gray-100"
                      }
                    `}
                  >
                    {/* Active indicator bar (left) */}
                    <span
                      className={`
                        absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r
                        ${isActive ? "bg-white/90" : "bg-transparent group-hover:bg-[#0F3659]/50"}
                      `}
                      aria-hidden
                    />
                    <i
                      className={`${icon} text-lg ${isActive ? "opacity-100" : "opacity-80 group-hover:opacity-100"}`}
                      aria-hidden
                    />
                    <span className="truncate text-sm font-medium">{label}</span>
                    {/* Chevron on hover */}
                    <i
                      className={`ri-arrow-right-s-line ml-auto text-base transition-transform ${
                        isActive ? "opacity-90 translate-x-0" : "opacity-0 -translate-x-1 group-hover:opacity-60 group-hover:translate-x-0"
                      }`}
                      aria-hidden
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer actions */}
        <div className="mt-auto px-4 pb-5 pt-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="
              w-full inline-flex items-center justify-center gap-2
              rounded-xl px-3 py-2.5
              text-sm font-medium
              text-gray-700 hover:text-[#0F3659]
              border border-gray-200 hover:border-[#0F3659]/50
              transition-colors
              focus:outline-none focus:ring-2 focus:ring-[#0F3659]/40
            "
          >
            <i className="ri-logout-circle-line text-lg" aria-hidden />
            ออกจากระบบ
          </button>
        </div>
      </aside>
    </>
  );
}
