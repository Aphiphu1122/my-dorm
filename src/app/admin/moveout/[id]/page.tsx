"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Image from "next/image";
import Link from "next/link";
import Sidebar from "@/components/sidebar";

/* ================= Types ================= */
type MoveOutStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
type BillStatus = "UNPAID" | "PENDING_APPROVAL" | "PAID";

type Bill = {
  id: string;
  billingMonth: string; // ISO string from API (Date serialized)
  totalAmount: number;
  status: BillStatus;
};

type MoveOutRequest = {
  id: string;
  reason: string;
  note?: string | null;
  moveOutDate: string;
  createdAt: string;
  status: MoveOutStatus;
  imageUrl?: string | null;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    bills?: Bill[];
  };
  room: {
    roomNumber: string;
  };
};

type GetResponse =
  | { success: true; request: MoveOutRequest }
  | { success?: false; error: unknown };

/* ================= Utils ================= */
function formatMonthTH(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
  });
}
function formatDateTH(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

function extractErrorMessage(e: unknown): string {
  if (!e) return "เกิดข้อผิดพลาด";
  if (typeof e === "string") return e;

  // Error object ทั่วไป
  if (e instanceof Error && e.message) return e.message;

  if (isRecord(e)) {
    const obj = e as Record<string, unknown>;

    // รูปแบบ { error: "..." }
    const errVal = obj["error"];
    if (typeof errVal === "string") return errVal;

    // รูปแบบ Zod: { error: { formErrors: { formErrors: string[] } } }
    if (isRecord(errVal)) {
      const formErrorsObj = errVal["formErrors"];
      if (isRecord(formErrorsObj)) {
        const fe = formErrorsObj["formErrors"];
        if (Array.isArray(fe) && fe.length) {
          return fe.filter((s): s is string => typeof s === "string").join(", ");
        }
      }
    }

    // รูปแบบ { message: "..." }
    const msg = obj["message"];
    if (typeof msg === "string") return msg;
  }

  return "เกิดข้อผิดพลาด";
}

/* ================= Page ================= */
export default function AdminMoveOutDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string | undefined;

  const [request, setRequest] = useState<MoveOutRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Confirm modal
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<MoveOutStatus | null>(
    null
  );
  const [rejectNote, setRejectNote] = useState("");

  const hasUnpaid = useMemo(
    () => (request?.user?.bills?.length ?? 0) > 0,
    [request]
  );

  useEffect(() => {
    if (!id) {
      toast.error("ไม่พบรหัสคำร้อง");
      router.push("/admin/moveout");
      return;
    }
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/moveout/${id}`, {
          credentials: "include",
        });
        const data: GetResponse = await res.json();

        if (!res.ok || !("success" in data) || !data.success) {
          throw new Error(extractErrorMessage(data));
        }
        setRequest(data.request);
      } catch (err) {
        console.error(err);
        toast.error(extractErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id, router]);

  const handleConfirm = (status: MoveOutStatus) => {
    setConfirmAction(status);
    setRejectNote("");
    setShowConfirm(true);
  };

  const handleUpdateStatus = async (status: MoveOutStatus) => {
    if (!id) return;

    // client-side validation: require note when REJECTED
    if (status === "REJECTED" && !rejectNote.trim()) {
      toast.error("กรุณากรอกหมายเหตุเมื่อปฏิเสธคำร้อง");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/moveout/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          ...(status === "REJECTED" ? { note: rejectNote.trim() } : {}),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(extractErrorMessage(data));
      }

      setRequest((prev) => (prev ? { ...prev, status, note: data?.request?.note ?? prev.note } : prev));
      toast.success(
        `อัปเดตสถานะเป็น ${
          status === "APPROVED" ? "อนุมัติแล้ว" : "ปฏิเสธแล้ว"
        }`
      );
      router.push("/admin/moveout");
    } catch (err) {
      console.error(err);
      toast.error(extractErrorMessage(err));
    } finally {
      setIsProcessing(false);
      setShowConfirm(false);
    }
  };

  if (loading) {
    return <p className="text-center mt-10 text-gray-600">กำลังโหลดข้อมูล...</p>;
  }

  if (!request) {
    return <p className="text-center mt-10 text-red-600">ไม่พบข้อมูลคำร้อง</p>;
  }

  return (
    <div className="flex min-h-screen bg-white text-black">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-200 sticky top-0 h-screen">
        <Sidebar role="admin" />
      </aside>

      <div className="flex-1 max-w-5xl mx-auto p-8">
        <div>
          <h1 className="text-3xl font-bold text-[#0F3659]">รายละเอียดคำร้องขอย้ายออก</h1>
          <p className="text-gray-600 mt-1">จัดการคำร้องขอย้ายออกของผู้เช่า</p>
        </div>

        <div className="bg-white mt-5">
          {/* Tenant info */}
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-blue-950">ข้อมูลผู้เช่า</h2>
            <div className="bg-white shadow-md rounded-lg p-2">
              <div className="divide-y divide-gray-200">
                <div className="grid grid-cols-2 py-1">
                  <strong className="p-2 text-gray-700">ชื่อ-นามสกุล</strong>
                  <span className="text-right mr-5">
                    {request.user.firstName} {request.user.lastName}
                  </span>
                </div>
                <div className="grid grid-cols-2 py-1">
                  <strong className="p-2 text-gray-700">อีเมล</strong>
                  <span className="text-right mr-5">{request.user.email}</span>
                </div>
                {request.user?.phone && (
                  <div className="grid grid-cols-2 py-1">
                    <strong className="p-2 text-gray-700">เบอร์โทร</strong>
                    <span className="text-right mr-5">{request.user.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Room info */}
          <div className="space-y-2 mt-5">
            <h2 className="text-xl font-semibold text-blue-950">ข้อมูลห้องพัก</h2>
            <div className="bg-white shadow-md rounded-lg p-2">
              <div className="grid grid-cols-2 py-1">
                <strong className="p-2 text-gray-700">หมายเลขห้อง</strong>
                <span className="text-right mr-5">{request.room.roomNumber}</span>
              </div>
            </div>
          </div>

          {/* Move out info */}
          <div className="space-y-2 mt-5">
            <h2 className="text-xl font-semibold text-blue-950">ข้อมูลการย้ายออก</h2>
            <div className="bg-white shadow-md rounded-lg p-2">
              <div className="divide-y divide-gray-200">
                <div className="grid grid-cols-2 py-1">
                  <strong className="p-2 text-gray-700">วันที่ส่งคำร้อง</strong>
                  <span className="text-right mr-5">
                    {formatDateTH(request.createdAt)}
                  </span>
                </div>
                <div className="grid grid-cols-2 py-1">
                  <strong className="p-2 text-gray-700">วันที่จะย้ายออก</strong>
                  <span className="text-right mr-5">
                    {formatDateTH(request.moveOutDate)}
                  </span>
                </div>
                <div className="grid grid-cols-2 py-1">
                  <strong className="p-2 text-gray-700">เหตุผล</strong>
                  <span className="text-right mr-5">{request.reason}</span>
                </div>
                {request.note && (
                  <div className="grid grid-cols-2 py-1">
                    <strong className="p-2 text-gray-700">หมายเหตุ</strong>
                    <span className="text-right mr-5">{request.note}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Attached image */}
          {request.imageUrl && (
            <div className="mt-5">
              <p className="mb-2">
                <strong>รูปประกอบ:</strong>
              </p>
              <Image
                src={request.imageUrl}
                alt="รูปภาพแนบ"
                width={400}
                height={300}
                className="rounded-lg border"
              />
            </div>
          )}

          {/* Unpaid bills */}
          {request.user.bills && request.user.bills.length > 0 && (
            <div className="space-y-2 mt-5">
              <h2 className="text-xl font-semibold text-red-600">บิลที่ยังไม่ได้ชำระ</h2>
              <div className="bg-white shadow-md rounded-lg p-2">
                <div className="divide-y divide-gray-200">
                  {request.user.bills.map((bill) => (
                    <div key={bill.id} className="grid grid-cols-4 items-center py-2">
                      <span className="font-medium text-gray-700">
                        {formatMonthTH(bill.billingMonth)}
                      </span>
                      <span className="text-gray-600 text-right">
                        {bill.totalAmount.toLocaleString()} ฿
                      </span>
                      <span
                        className={`text-right font-semibold ${
                          bill.status === "UNPAID"
                            ? "text-red-600"
                            : bill.status === "PAID"
                            ? "text-green-600"
                            : "text-yellow-700"
                        }`}
                      >
                        {bill.status === "UNPAID"
                          ? "ยังไม่ชำระ"
                          : bill.status === "PAID"
                          ? "ชำระแล้ว"
                          : "รอตรวจสอบ"}
                      </span>
                      <Link
                        href={`/admin/bills/${bill.id}`}
                        className="text-blue-600 hover:underline text-right"
                      >
                        ดูบิล
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-600">
                * ระบบจะไม่อนุมัติคำร้องถ้ายังมีบิลค้างชำระ
              </p>
            </div>
          )}

          {/* Status + Actions */}
          <div className="space-y-2 mt-5">
            <h2 className="text-xl font-semibold text-blue-950">สถานะ</h2>
            <div className="bg-white shadow-md rounded-lg p-2">
              <div className="grid grid-cols-2 py-1 items-center">
                {/* Status Badge */}
                <div className="flex items-center justify-start p-2">
                  {request.status === "PENDING_APPROVAL" && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 font-semibold text-sm">
                      <i className="ri-indeterminate-circle-fill"></i> รออนุมัติ
                    </span>
                  )}
                  {request.status === "APPROVED" && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold text-sm">
                      <i className="ri-checkbox-circle-fill"></i> อนุมัติแล้ว
                    </span>
                  )}
                  {request.status === "REJECTED" && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-700 font-semibold text-sm">
                      <i className="ri-close-circle-fill"></i> ปฏิเสธแล้ว
                    </span>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end gap-4 p-2">
                  {request.status === "PENDING_APPROVAL" && (
                    <>
                      <button
                        onClick={() => handleConfirm("APPROVED")}
                        disabled={isProcessing || hasUnpaid}
                        className={`px-4 py-2 rounded text-white transition disabled:opacity-50 ${
                          hasUnpaid
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-green-600 hover:bg-green-700"
                        }`}
                      >
                        อนุมัติ
                      </button>
                      <button
                        onClick={() => handleConfirm("REJECTED")}
                        disabled={isProcessing}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition disabled:opacity-50"
                      >
                        ปฏิเสธ
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Link
            href="/admin/moveout"
            className="inline-block px-4 py-2 mt-5 bg-gray-400 text-white rounded hover:bg-gray-500 transition duration-200 transform hover:scale-105"
          >
            กลับไปหน้าคำร้องทั้งหมด
          </Link>
        </div>

        {/* Confirm Modal */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md space-y-4">
              <h2 className="text-xl font-bold text-center text-gray-800">
                ยืนยันการดำเนินการ
              </h2>

              {confirmAction === "REJECTED" ? (
                <>
                  <p className="text-center text-gray-600">
                    กรุณาระบุ <span className="font-semibold">หมายเหตุ</span> สำหรับการปฏิเสธคำร้องนี้
                  </p>
                  <textarea
                    className="w-full rounded border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-red-300"
                    placeholder="ระบุเหตุผล/หมายเหตุ..."
                    rows={4}
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                  />
                </>
              ) : (
                <p className="text-center text-gray-600">
                  คุณแน่ใจหรือไม่ว่าต้องการ{" "}
                  <span className="text-green-600 font-semibold">อนุมัติ</span>{" "}
                  คำร้องนี้?
                </p>
              )}

              <div className="flex justify-center gap-4 pt-2">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => confirmAction && handleUpdateStatus(confirmAction)}
                  className={`px-4 py-2 rounded text-white flex items-center gap-2 ${
                    confirmAction === "APPROVED"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                  disabled={isProcessing || (confirmAction === "REJECTED" && !rejectNote.trim())}
                >
                  {isProcessing && (
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                  )}
                  ยืนยัน
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
