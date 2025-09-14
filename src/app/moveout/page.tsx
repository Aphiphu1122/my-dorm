"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import "remixicon/fonts/remixicon.css";
import Sidebar from "@/components/sidebar";
import dayjs from "dayjs";

// ---------- helpers ----------
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function getApiErrorMessage(v: unknown): string {
  if (isRecord(v) && "error" in v) {
    const e = (v as { error: unknown }).error;
    if (typeof e === "string") return e;
    if (isRecord(e) && "message" in e && typeof e.message === "string") {
      return e.message as string;
    }
  }
  return "โหลดข้อมูลไม่สำเร็จ";
}

// ---------- types ----------
type Room = {
  id: string;
  roomNumber: string;
};

type Contract = {
  id: string;
  startDate: string;      // ISO
  endDate: string;        // ISO
  contractDate: string;   // ISO (วันที่ทำสัญญา)
  rentPerMonth: number;
  dormOwnerName: string;
  dormAddress: string;
  contractImages: string[];
};

type MeResponse = {
  firstName: string;
  lastName: string;
  email: string;
  roomStartDate: string | null;
  roomId: string | null;
  roomNumber: string | null;
  contracts?: Contract[];
};

type UserInfo = {
  firstName: string;
  lastName: string;
  email: string;
  roomStartDate: string;      // ISO
  roomNumber: string;
  // จาก “สัญญาล่าสุด”
  contractStart?: string | null;
  contractEnd?: string | null;
  rentPerMonth?: number | null;
};

// ---------- page ----------
export default function MoveOutRequestPage() {
  const router = useRouter();

  const [room, setRoom] = useState<Room | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [reason, setReason] = useState("");
  const [moveOutDate, setMoveOutDate] = useState("");
  const [password, setPassword] = useState("");
  const [agreePolicy, setAgreePolicy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // ====== ค่าคงที่/วันที่ ======
  const today = dayjs();
  const earliestNotice = today.add(30, "day"); // ต้องแจ้งล่วงหน้า >=30 วัน
  const minDateStr = earliestNotice.format("YYYY-MM-DD");

  // ====== โหลดข้อมูลผู้ใช้ + ห้อง + สัญญาล่าสุด ======
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch("/api/profile/me", { credentials: "include" });
        const body: unknown = await res.json();

        if (!res.ok) {
          toast.error(getApiErrorMessage(body));
          return;
        }

        const data = body as MeResponse;

        if (!data.roomId || !data.roomNumber) {
          toast.error("ไม่พบข้อมูลห้องของคุณ");
          return;
        }

        // เลือก “สัญญาล่าสุด” โดยให้ความสำคัญที่ contractDate > startDate
        const latest = (data.contracts ?? []).reduce<Contract | null>((acc, cur) => {
          if (!acc) return cur;
          const aKey = acc.contractDate || acc.startDate;
          const bKey = cur.contractDate || cur.startDate;
          return dayjs(bKey).isAfter(dayjs(aKey)) ? cur : acc;
        }, null);

        setRoom({ id: data.roomId, roomNumber: data.roomNumber });

        // roomStartDate: ถ้า null ให้ fallback เป็น startDate ของสัญญาล่าสุด (ถ้ามี)
        const effectiveStart = data.roomStartDate ?? latest?.startDate ?? new Date().toISOString();

        setUserInfo({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          roomStartDate: effectiveStart,
          roomNumber: data.roomNumber,
          contractStart: latest?.startDate ?? null,
          contractEnd: latest?.endDate ?? null,
          rentPerMonth: latest?.rentPerMonth ?? null,
        });
      } catch (err) {
        console.error(err);
        toast.error("ไม่สามารถโหลดข้อมูลได้");
      } finally {
        setInitialLoading(false);
      }
    };

    fetchMe();
  }, []);

  // ====== ค่าที่คำนวณเพื่อแสดงผล ======
  const contractEndText = useMemo(() => {
    if (!userInfo?.contractEnd) return "-";
    return dayjs(userInfo.contractEnd).format("DD MMM YYYY");
  }, [userInfo?.contractEnd]);

  const daysToContractEnd = useMemo(() => {
    if (!userInfo?.contractEnd) return null;
    const diff = dayjs(userInfo.contractEnd).startOf("day").diff(today.startOf("day"), "day");
    return diff;
  }, [userInfo?.contractEnd, today]);

  // ====== ส่งคำร้อง ======
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) return toast.error("กรุณาระบุเหตุผลในการย้ายออก");
    if (!moveOutDate) return toast.error("กรุณาเลือกวันที่ย้ายออก");
    if (!password.trim()) return toast.error("กรุณากรอกรหัสผ่านเพื่อยืนยันตัวตน");
    if (!room?.id) return toast.error("ไม่พบข้อมูลห้องพัก");
    if (!agreePolicy)
      return toast.error("กรุณายอมรับเงื่อนไขการยื่นคำร้องอย่างน้อย 30 วันล่วงหน้า");

    // ต้องอย่างน้อย 30 วันถัดไป (และไม่ใช่เดือนปัจจุบัน)
    const selected = dayjs(moveOutDate);
    if (selected.isBefore(earliestNotice, "day")) {
      return toast.error(`วันที่ย้ายออกต้องไม่น้อยกว่า ${earliestNotice.format("DD/MM/YYYY")}`);
    }
    if (selected.month() === today.month() && selected.year() === today.year()) {
      return toast.error("ไม่สามารถยื่นคำร้องในเดือนปัจจุบันได้");
    }

    // เตือนถ้าเกินวันสิ้นสุดสัญญา
    if (userInfo?.contractEnd && selected.isAfter(dayjs(userInfo.contractEnd), "day")) {
      toast.dismiss();
      toast("วันที่ที่เลือกเกินวันสิ้นสุดสัญญา", { icon: "⚠️" });
    }

    setLoading(true);
    try {
      const res = await fetch("/api/moveout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: room.id,
          reason,
          moveOutDate,
          password,
          acceptTerms: agreePolicy,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("ส่งคำร้องขอย้ายออกเรียบร้อยแล้ว");
        router.push("/home");
      } else {
        if (data?.error?.password) toast.error(data.error.password[0]);
        else if (data?.error?.reason) toast.error(data.error.reason[0]);
        else if (typeof data?.error === "string") toast.error(data.error);
        else toast.error("เกิดข้อผิดพลาดไม่ทราบสาเหตุ");
      }
    } catch (err) {
      console.error(err);
      toast.error("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-200 sticky top-0 h-screen">
        <Sidebar role="user" />
      </aside>

      <main className="flex-1 p-8 max-w-6xl mx-auto">
        {initialLoading ? (
          <div className="text-center py-24 text-gray-400 text-lg font-medium animate-pulse">
            กำลังโหลดข้อมูล...
          </div>
        ) : (
          <>
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold mb-1 text-[#0F3659]">คำร้องขอย้ายออก</h1>
              <p className="text-gray-500 mb-6">จัดการคำร้องขอย้ายออกของคุณได้ที่นี่</p>
            </div>

            {/* Personal Info Panel */}
            {userInfo && room && (
              <div className="bg-white p-6 rounded-2xl shadow-xl mb-10 border border-gray-100">
                <h2 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
                  <i className="ri-user-line text-2xl text-blue-700" /> ข้อมูลส่วนตัว
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition">
                    <p className="text-gray-500 text-sm">ชื่อ–นามสกุล</p>
                    <p className="font-semibold text-gray-900">
                      {userInfo.firstName} {userInfo.lastName}
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition">
                    <p className="text-gray-500 text-sm">อีเมล</p>
                    <p className="font-semibold text-gray-900">{userInfo.email}</p>
                  </div>

                  <div className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition">
                    <p className="text-gray-500 text-sm">หมายเลขห้อง</p>
                    <p className="font-semibold text-gray-900">{userInfo.roomNumber}</p>
                  </div>

                  <div className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition">
                    <p className="text-gray-500 text-sm">วันที่เข้าพัก</p>
                    <p className="font-semibold text-gray-900">
                      {dayjs(userInfo.roomStartDate).format("DD MMM YYYY")}
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition">
                    <p className="text-gray-500 text-sm">วันสิ้นสุดสัญญา (ล่าสุด)</p>
                    <p className="font-semibold text-gray-900">{contractEndText}</p>
                    {daysToContractEnd !== null && (
                      <p className="text-xs text-gray-500">
                        เหลืออีก {daysToContractEnd} วันถึงสิ้นสุดสัญญา
                      </p>
                    )}
                  </div>

                  <div className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition">
                    <p className="text-gray-500 text-sm">ค่าเช่ารายเดือน</p>
                    <p className="font-semibold text-gray-900">
                      {userInfo.rentPerMonth ? `${userInfo.rentPerMonth.toLocaleString()} บาท` : "-"}
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition md:col-span-2 lg:col-span-3">
                    <p className="text-gray-500 text-sm">แจ้งย้ายออกได้เร็วที่สุด</p>
                    <p className="font-semibold text-gray-900">
                      {earliestNotice.format("DD MMM YYYY")} (ต้องล่วงหน้าอย่างน้อย 30 วัน)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Move-out Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Reason */}
              <div className="mb-10 border border-gray-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition">
                <label className=" text-lg font-semibold text-black mb-2 flex items-center gap-2">
                  <i className="ri-file-text-line text-2xl text-blue-500" /> เหตุผลในการย้ายออก
                </label>
                <textarea
                  className="w-full border border-gray-200 rounded-xl p-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  placeholder="โปรดระบุเหตุผลการย้ายออก"
                />
              </div>

              {/* Date & Password */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition">
                  <label className=" font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <i className="ri-calendar-line text-green-500" /> วันที่ย้ายออก
                  </label>
                  <input
                    type="date"
                    className="w-full border border-gray-200 rounded-xl p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    value={moveOutDate}
                    onChange={(e) => setMoveOutDate(e.target.value)}
                    min={minDateStr}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    ต้องไม่ก่อนวันที่ {earliestNotice.format("DD/MM/YYYY")}
                  </p>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition">
                  <label className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <i className="ri-lock-line text-red-500" /> รหัสผ่านยืนยัน
                  </label>
                  <input
                    type="password"
                    className="w-full border border-gray-200 rounded-xl p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="กรอกรหัสผ่านของคุณ"
                  />
                </div>
              </div>

              {/* Policy Agreement */}
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={agreePolicy}
                  onChange={(e) => setAgreePolicy(e.target.checked)}
                  className="mt-1 w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-400"
                />
                <p className="text-gray-700 text-sm">
                  ข้าพเจ้าเข้าใจและยอมรับว่า{" "}
                  <span className="font-semibold underline">
                    ต้องยื่นคำร้องอย่างน้อย 30 วันล่วงหน้าก่อนย้ายออก
                  </span>{" "}
                  เพื่อขอรับเงินประกันคืน
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-2xl font-bold text-white transition-all ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 shadow-lg hover:shadow-xl"
                }`}
              >
                {loading ? "กำลังส่ง..." : "ส่งคำร้องขอย้ายออก"}
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
