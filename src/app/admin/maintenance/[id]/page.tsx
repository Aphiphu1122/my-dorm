"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import Image from "next/image";

interface MaintenanceRequest {
  id: string;
  description: string;
  status: string;
  category: string;
  imageUrl?: string;
  createdAt: string;
  room: {
    roomNumber: string;
  };
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}

export default function MaintenanceDetailPage() {
  const { id } = useParams();
  const [request, setRequest] = useState<MaintenanceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

useEffect(() => {
  if (!id || typeof id !== 'string') return;

  const fetchRequest = async () => {
    console.log("📤 เรียก API ด้วย id:", id);
    try {
      const res = await fetch(`/api/admin/maintenance/${id}`);
      console.log("📥 ได้ response แล้ว:", res.status);

      if (!res.ok) {
        console.error("❌ response ไม่สำเร็จ:", res.statusText);
        return;
      }

      const data = await res.json();
      console.log("✅ data ที่ได้จาก API:", data);
      setRequest(data.request);
    } catch (error) {
      console.error("❌ Failed to fetch maintenance request", error);
    } finally {
      setLoading(false);
    }
  };

  fetchRequest();
}, [id]);


  const getStatusEmoji = (status: string) => {
    switch (status) {
      case "PENDING":
        return "⏳";
      case "IN_PROGRESS":
        return "🟡";
      case "COMPLETED":
        return "🟢";
      case "CANCLE":
        return "🔴";
      default:
        return "";
    }
  };

  if (loading) {
    console.log("⏳ กำลังโหลดข้อมูล...");
    return <p className="p-4">Loading...</p>;
  }

  if (!request) {
    console.warn("⚠️ ไม่พบข้อมูล request");
    return <p className="p-4">ไม่พบข้อมูลรายการซ่อม</p>;
  }

  console.log("🎯 แสดงข้อมูล request:", request);

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">รายละเอียดการแจ้งซ่อม</h1>

      <div className="bg-black shadow p-4 rounded-xl space-y-4">
        <p><strong>Request ID:</strong> {request.id}</p>
        <p><strong>วันที่แจ้ง:</strong> {new Date(request.createdAt).toLocaleString()}</p>
        <p><strong>สถานะ:</strong> {getStatusEmoji(request.status)} {request.status}</p>
        <p><strong>หมวดหมู่:</strong> {request.category}</p>
        <p><strong>คำอธิบาย:</strong> {request.description}</p>

        <hr />

        <p><strong>ห้อง:</strong> {request.room.roomNumber}</p>

        <p><strong>ผู้แจ้ง:</strong> {request.user.firstName} {request.user.lastName}</p>
        <p><strong>อีเมล:</strong> {request.user.email}</p>
        <p><strong>โทรศัพท์:</strong> {request.user.phone}</p>

        {request.imageUrl && (
          <div>
            <p className="font-semibold">รูปภาพ:</p>
            <Image
              src={request.imageUrl}
              alt="Maintenance Image"
              width={600}
              height={400}
              className="rounded border mt-2"
            />
          </div>
        )}

 {/* ✅ Section สำหรับอัปเดตสถานะ */}
  <hr />
  <div className="mt-4">
    <label htmlFor="status" className="font-semibold block mb-1">อัปเดตสถานะ:</label>
    <select
      id="status"
      className="border p-2 rounded w-full max-w-xs text-black"
      value={request.status}
      onChange={(e) => setRequest({ ...request, status: e.target.value })}
    >
      <option value="PENDING">⏳ รอดำเนินการ</option>
      <option value="IN_PROGRESS">🟡 กำลังดำเนินการ</option>
      <option value="COMPLETED">🟢 เสร็จสิ้น</option>
      <option value="CANCLE">🔴 ยกเลิก</option>
    </select>

    <button
      onClick={async () => {
        try {
          const res = await fetch(`/api/admin/maintenance/${request.id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: request.status }),
          });

          if (!res.ok) throw new Error("อัปเดตสถานะไม่สำเร็จ");

          alert("✅ อัปเดตสถานะเรียบร้อยแล้ว!");
          router.refresh(); // reload page
        } catch (err) {
          console.error("❌ อัปเดตล้มเหลว", err);
          alert("❌ อัปเดตล้มเหลว");
        }
      }}
      className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
    >
      อัปเดตสถานะ
    </button>
  </div>

  <button
    className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
    onClick={() => router.back()}
  >
    ย้อนกลับ
  </button>
</div>
    </div>
  );
}
