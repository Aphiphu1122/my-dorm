"use client";
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { toast } from "react-hot-toast";
import Link from "next/link";
import NotificationBell from "@/components/NotificationBell";
import Sidebar from "@/components/sidebar";

/** ---------- Types ---------- */
type Bill = {
  id: string;
  billingMonth: string;
  totalAmount: number;
  status: "PAID" | "UNPAID" | "PENDING_APPROVAL";
};

type Notification = {
  id: string;
  message: string;
  createdAt: string;
  read: boolean;
};

type Contract = {
  id: string;
  startDate: string;
  endDate: string;
  contractDate?: string;
  rentPerMonth: number;
  dormOwnerName?: string;
  dormAddress?: string;
  contractImages?: string[];
};

type ActiveMoveOut =
  | {
      id: string;
      status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
      moveOutDate: string;
      createdAt: string;
    }
  | null;

type MeApi = {
  firstName: string;
  lastName: string;
  email: string;
  room?: { roomNumber?: string | null; rentAmount?: number | null } | null;
  roomNumber?: string | null;
  roomStartDate?: string | null;
  contracts?: Contract[];
  lastContract?: Partial<Contract> | null;
  activeMoveOut?: ActiveMoveOut;
};

type UserForUI = {
  firstName: string;
  lastName: string;
  email: string;
  roomNumber: string | null;
  roomStartDate: string | null;
  rentAmount: number | null;
  contractStart: string | null;
  contractEnd: string | null;
  dormOwnerName?: string | null;
  dormAddress?: string | null;
  activeMoveOut?: ActiveMoveOut;
};

export default function HomePage() {
  const [user, setUser] = useState<UserForUI | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/profile/me", { credentials: "include" });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          toast.error((body && (body.error as string)) || "ไม่สามารถโหลดข้อมูลผู้ใช้ได้");
          return;
        }
        const data = (await res.json()) as MeApi;

        const latest: Partial<Contract> | null =
          (data.lastContract as Partial<Contract> | null) ??
          (Array.isArray(data.contracts) && data.contracts.length
            ? data.contracts.reduce<Contract | null>((acc, c) => {
                if (!acc) return c;
                return new Date(c.startDate) > new Date(acc.startDate) ? c : acc;
              }, null)
            : null);

        const roomNumber = data.room?.roomNumber ?? data.roomNumber ?? null;
        const rentAmount =
          (latest?.rentPerMonth as number | undefined) ??
          data.room?.rentAmount ??
          null;

        const ui: UserForUI = {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          roomNumber,
          roomStartDate: data.roomStartDate ?? null,
          rentAmount,
          contractStart: (latest?.startDate as string) ?? null,
          contractEnd: (latest?.endDate as string) ?? null,
          dormOwnerName: (latest?.dormOwnerName as string) ?? null,
          dormAddress: (latest?.dormAddress as string) ?? null,
          activeMoveOut: data.activeMoveOut ?? null,
        };

        setUser(ui);
      } catch (err) {
        console.error(err);
        toast.error("ไม่สามารถโหลดข้อมูลผู้ใช้ได้");
      }
    };

    const fetchBills = async () => {
      try {
        const res = await fetch("/api/bills", { credentials: "include" });
        if (!res.ok) {
          toast.error("ไม่สามารถโหลดข้อมูลบิลได้");
          return;
        }
        const data = await res.json();
        setBills(Array.isArray(data?.bills) ? data.bills : []);
      } catch (e) {
        console.error(e);
      }
    };

    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/notifications/me", {
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        const notiArray = Array.isArray(data) ? data : data.notifications;
        if (Array.isArray(notiArray)) setNotifications(notiArray);
      } catch {}
    };

    fetchProfile();
    fetchBills();
    fetchNotifications();
  }, []);

  const handleClearNotifications = async (idsToClear?: string[]) => {
    try {
      if (idsToClear?.length) {
        await fetch("/api/notifications/me", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: idsToClear }),
        });
        setNotifications((prev) => prev.filter((n) => !idsToClear.includes(n.id)));
      } else {
        await fetch("/api/notifications/me", { method: "DELETE" });
        setNotifications([]);
      }
      toast.success("ล้างการแจ้งเตือนเรียบร้อยแล้ว");
    } catch (err) {
      console.error("Failed to delete notifications", err);
      toast.error("ไม่สามารถล้างการแจ้งเตือนได้");
    }
  };

  /** ---------- ค่าที่จำเป็นแสดงเพิ่มในหน้า Home ---------- */
  const today = dayjs();
  const dueDay = 5; // กำหนดชำระในทุกเดือนวันที่ 5
  const currentMonthBill = useMemo(() => {
    return bills.find((b) => {
      const d = dayjs(b.billingMonth);
      return d.year() === today.year() && d.month() === today.month();
    });
  }, [bills, today]);

  const daysLeftToDue = useMemo(() => {
    const dueDate = dayjs().date(dueDay);
    const base = today.startOf("day");
    return dueDate.startOf("day").diff(base, "day");
  }, [today]);

  return (
    <div className="flex min-h-screen bg-white text-black">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-200 sticky top-0 h-screen">
        <Sidebar role="user" />
      </aside>

      <main className="flex-1 p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 px-4 md:px-6">
          <div>
            <h1 className="text-3xl font-bold mb-1 text-[#0F3659]">
              สวัสดีคุณ {user?.firstName} {user?.lastName}
            </h1>
            <p className="text-gray-600">ยินดีต้อนรับสู่ระบบจัดการหอพัก</p>
          </div>
          <NotificationBell
            notifications={notifications}
            onClearNotifications={handleClearNotifications}
            onMarkRead={async (id) => {
              try {
                await fetch(`/api/notifications/${id}`, {
                  method: "PATCH",
                  credentials: "include",
                });
                setNotifications((prev) =>
                  prev.map((n) => (n.id === id ? { ...n, read: true } : n))
                );
              } catch (err) {
                console.error("Failed to mark notification as read", err);
                toast.error("ไม่สามารถอัปเดตการแจ้งเตือนได้");
              }
            }}
          />
        </div>

        {/* ===== Quick Actions (แทนสไลด์รูป) ===== */}
        <section className="px-4 md:px-6 mb-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                href: "/profile",
                title: "โปรไฟล์",
                desc: "ตรวจสอบ/แก้ไขข้อมูลส่วนตัว",
                icon: "ri-id-card-line",
              },
              {
                href: "/bills",
                title: "บิลค่าเช่า",
                desc: "ดูบิล แนบสลิป ชำระเงิน",
                icon: "ri-bill-line",
              },
              {
                href: "/maintenance",
                title: "แจ้งซ่อม",
                desc: "ส่งคำขอซ่อม ติดตามสถานะ",
                icon: "ri-tools-line",
              },
              {
                href: "/moveout",
                title: "ย้ายออก",
                desc: "ยื่นคำร้อง แจ้งกำหนดการ",
                icon: "ri-logout-box-r-line",
              },
            ].map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {/* แถบไฮไลต์บนการ์ด */}
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#0F3659] via-indigo-500 to-sky-400" />
                <div className="p-5">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-11 w-11 rounded-xl border border-gray-200 bg-gray-50
                                 grid place-items-center group-hover:scale-105 transition"
                    >
                      <i className={`${a.icon} text-2xl text-[#0F3659]`} />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-[#0F3659]">
                        {a.title}
                      </h3>
                      <p className="text-sm text-gray-600">{a.desc}</p>
                    </div>
                  </div>
                </div>
                {/* เส้นขอบล่างตอน hover */}
                <div className="absolute inset-x-0 bottom-0 h-[2px] bg-transparent group-hover:bg-[#0F3659]/70 transition" />
              </Link>
            ))}
          </div>
        </section>

        {/* Tenant Info (ข้อมูลผู้เช่า) */}
        <div className="mb-8 px-4 md:px-6">
          <h2 className="text-xl font-semibold mb-3">ข้อมูลผู้เช่า</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="text-gray-500 text-sm">เลขห้องพัก</div>
              <div className="text-lg font-semibold">
                {user?.roomNumber ?? "-"}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="text-gray-500 text-sm">ค่าเช่ารายเดือน</div>
              <div className="text-lg font-semibold">
                {user?.rentAmount ? `${user.rentAmount.toLocaleString()} บาท` : "-"}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                กำหนดชำระภายในวันที่ 5 ของทุกเดือน
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="text-gray-500 text-sm">วันที่เข้าพัก</div>
              <div className="text-lg font-semibold">
                {user?.roomStartDate ? dayjs(user.roomStartDate).format("DD MMM YYYY") : "-"}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="text-gray-500 text-sm">เริ่มสัญญา</div>
              <div className="text-lg font-semibold">
                {user?.contractStart ? dayjs(user.contractStart).format("DD MMM YYYY") : "-"}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="text-gray-500 text-sm">สิ้นสุดสัญญา</div>
              <div className="text-lg font-semibold">
                {user?.contractEnd ? dayjs(user.contractEnd).format("DD MMM YYYY") : "-"}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="text-gray-500 text-sm">ผู้ให้เช่า / ที่อยู่หอ</div>
              <div className="text-sm">
                <div className="font-semibold">{user?.dormOwnerName || "-"}</div>
                <div className="text-gray-700">{user?.dormAddress || "-"}</div>
              </div>
            </div>

            {/* สรุปบิลเดือนปัจจุบัน */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm md:col-span-2 lg:col-span-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="text-gray-700">
                  <span className="font-semibold">บิลเดือนนี้:</span> {dayjs().format("MMMM YYYY")}
                </div>
                <div className="text-gray-700">
                  <span className="font-semibold">ยอดรวม:</span>{" "}
                  {currentMonthBill ? `${currentMonthBill.totalAmount.toLocaleString()} บาท` : "-"}
                </div>
                <div className="text-gray-700">
                  <span className="font-semibold">สถานะ:</span>{" "}
                  {currentMonthBill ? (
                    currentMonthBill.status === "PAID" ? (
                      <span className="text-green-600">ชำระแล้ว</span>
                    ) : currentMonthBill.status === "PENDING_APPROVAL" ? (
                      <span className="text-amber-600">รอการอนุมัติ</span>
                    ) : (
                      <span className="text-rose-600">ยังไม่ชำระ</span>
                    )
                  ) : (
                    "-"
                  )}
                </div>
                <div className="text-gray-700">
                  <span className="font-semibold">ครบกำหนด:</span>{" "}
                  {dayjs().date(dueDay).format("DD MMM YYYY")}{" "}
                  <span className="text-xs text-gray-500">(เหลืออีก {daysLeftToDue} วัน)</span>
                </div>
                {currentMonthBill && (
                  <Link
                    href={`/bills/${currentMonthBill.id}`}
                    className="ml-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    ดูบิลเดือนนี้
                  </Link>
                )}
              </div>
            </div>

            {/* สถานะคำร้องย้ายออก (ถ้ามี) */}
            {user?.activeMoveOut && (
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm md:col-span-2 lg:col-span-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="font-semibold">สถานะคำร้องย้ายออก:</div>
                  <div>
                    {user.activeMoveOut.status === "PENDING_APPROVAL" && (
                      <span className="inline-flex bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs items-center gap-1">
                        <i className="ri-indeterminate-circle-fill text-yellow-600" />
                        รอการอนุมัติ
                      </span>
                    )}
                    {user.activeMoveOut.status === "APPROVED" && (
                      <span className="inline-flex bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs items-center gap-1">
                        <i className="ri-checkbox-circle-fill text-green-600" />
                        อนุมัติแล้ว
                      </span>
                    )}
                    {user.activeMoveOut.status === "REJECTED" && (
                      <span className="inline-flex bg-rose-100 text-rose-800 px-2 py-1 rounded-full text-xs items-center gap-1">
                        <i className="ri-close-circle-fill text-rose-600" />
                        ถูกปฏิเสธ
                      </span>
                    )}
                  </div>
                  <div className="text-gray-700">
                    <span className="font-semibold">วันที่ย้ายออก:</span>{" "}
                    {dayjs(user.activeMoveOut.moveOutDate).format("DD MMM YYYY")}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Payment History */}
        <div className="px-4 md:px-6">
          <h2 className="text-xl font-semibold mb-3">ประวัติการชำระเงิน</h2>
          <div className="overflow-x-auto border border-gray-200 rounded-md">
            <table className="min-w-full table-auto text-sm">
              <thead>
                <tr className="bg-gray-100 text-gray-600 text-left">
                  <th className="p-3">เดือน</th>
                  <th className="p-3">จำนวนเงิน</th>
                  <th className="p-3">สถานะ</th>
                  <th className="p-3">การดำเนินการ</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => (
                  <tr key={bill.id} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="p-3">
                      {new Date(bill.billingMonth).toLocaleDateString("th-TH", {
                        year: "numeric",
                        month: "long",
                      })}
                    </td>
                    <td className="p-3">{bill.totalAmount.toLocaleString()} บาท</td>
                    <td className="p-3">
                      {bill.status === "PAID" ? (
                        <span className="inline-flex bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs items-center gap-1">
                          <i className="ri-checkbox-circle-fill text-green-600" /> ชำระแล้ว
                        </span>
                      ) : bill.status === "PENDING_APPROVAL" ? (
                        <span className="inline-flex bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs items-center gap-1">
                          <i className="ri-indeterminate-circle-fill text-yellow-600" /> รอการอนุมัติ
                        </span>
                      ) : (
                        <span className="inline-flex bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs items-center gap-1">
                          <i className="ri-close-circle-fill text-red-600" /> ยังไม่ชำระ
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <Link href={`/bills/${bill.id}`} className="text-blue-600 underline text-sm hover:text-blue-800">
                        ดูรายละเอียด
                      </Link>
                    </td>
                  </tr>
                ))}
                {bills.length === 0 && (
                  <tr>
                    <td className="p-3 text-gray-500 italic" colSpan={4}>
                      ไม่พบประวัติการชำระเงิน
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
