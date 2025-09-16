"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import "remixicon/fonts/remixicon.css";

type Role = "admin" | "user";

const roleLinks: Record<Role, { href: string; label: string; icon: string }[]> = {
  admin: [
    { href: "/admin/dashboard", label: "แดชบอร์ด", icon: "ri-pie-chart-line" },
    { href: "/admin/tenants", label: "จัดการผู้เช่า", icon: "ri-team-line" },
    { href: "/admin/rooms", label: "จัดการห้องพัก", icon: "ri-home-9-line" },
    { href: "/admin/bills", label: "จัดการบิล", icon: "ri-refund-2-line" },
    { href: "/admin/maintenance", label: "คำขอแจ้งซ่อม", icon: "ri-tools-line" },
    { href: "/admin/moveout", label: "คำขอย้ายออก", icon: "ri-door-open-line" },
  ],
  user: [
    { href: "/home", label: "หน้าหลัก", icon: "ri-home-4-line" },
    { href: "/profile", label: "โปรไฟล์", icon: "ri-user-settings-line" },
    { href: "/bills", label: "บิลและการชำระเงิน", icon: "ri-refund-2-line" },
    { href: "/maintenance", label: "แจ้งซ่อม", icon: "ri-tools-line" },
    { href: "/moveout", label: "แจ้งย้ายออก", icon: "ri-door-open-line" },
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
      const res = await fetch("/api/logout");

      if (res.ok) {
        toast.success("ออกจากระบบเรียบร้อยแล้ว");

        setTimeout(() => {
          router.push("/");
        }, 1200);
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
      <aside className="w-64 min-h-screen bg-white px-4 py-6">
        <h2 className="text-2xl font-bold text-[#0F3659] mb-6 flex items-center gap-4">
          <span
            className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-[#0F3659] bg-[#0F3659]"
            aria-hidden="true"
          >
            <i className="ri-home-heart-fill text-white text-xl"></i>
          </span>
          หอพัก
        </h2>

        <h3 className="text-[#0F3659] font-bold mt-2 mb-3">{headerTitle}</h3>

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

        <h3 className="text-[#0F3659] font-bold mt-5 mb-3">การเข้าสู่ระบบ</h3>
        <button
          onClick={handleLogout}
          className="flex items-center px-3 py-2 text-gray-700 hover:text-[#0F3659] gap-2"
        >
          <i className="ri-logout-circle-line text-lg"></i> ออกจากระบบ
        </button>
      </aside>
    </>
  );
}
