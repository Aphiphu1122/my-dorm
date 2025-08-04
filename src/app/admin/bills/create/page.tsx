"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

type RoomWithTenant = {
  id: string;
  roomNumber: string;
  tenantId: string;
  tenant: {
    id: string;
    firstName: string;
    lastName: string;
  };
};

export default function CreateBillPage() {
  const router = useRouter();
  const [tenantRooms, setTenantRooms] = useState<RoomWithTenant[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    tenantId: "",
    roomId: "",
    billingMonth: "",
    rentAmount: 0,
    waterUnit: 0,
    waterRate: 0,
    electricUnit: 0,
    electricRate: 0,
  });

  useEffect(() => {
    const fetchRooms = async () => {
      const res = await fetch("/api/admin/active-tenants");
      const data = await res.json();
      setTenantRooms(data);
    };
    fetchRooms();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target;
  setForm((prev) => ({
    ...prev,
    [name]:
      name.includes("Amount") ||
      name.includes("Unit") ||
      name.includes("Rate")
        ? value === "" ? "" : parseFloat(value)
        : value,
    }));
 };


  const handleTenantSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTenantId = e.target.value;
    const room = tenantRooms.find((r) => r.tenantId === selectedTenantId);
    if (room) {
      setForm((prev) => ({
        ...prev,
        tenantId: selectedTenantId,
        roomId: room.id,
      }));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/bills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      toast.success("สร้างบิลเรียบร้อยแล้ว");
      router.push("/admin/bills");
    } else {
      const data = await res.json();
      toast.error(data.error?.message || "เกิดข้อผิดพลาดในการสร้างบิล");
    }

    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto mt-8 p-6 border rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4">สร้างบิลใหม่</h1>

      <div className="space-y-4">
        <div>
          <label className="block font-medium mb-1">เลือกผู้เช่า</label>
          <select
            name="tenantId"
            value={form.tenantId}
            onChange={handleTenantSelect}
            className="border p-2 w-full rounded"
          >
            <option value="">-- เลือกผู้เช่า --</option>
            {tenantRooms.map((room) => (
              <option key={room.tenantId} value={room.tenantId}>
                {room.tenant.firstName} {room.tenant.lastName} (ห้อง {room.roomNumber})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium mb-1">เดือนที่เรียกเก็บ</label>
          <input
            type="month"
            name="billingMonth"
            value={form.billingMonth}
            onChange={handleChange}
            className="border p-2 w-full rounded"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">ค่าเช่า (Rent)</label>
          <input
            type="number"
            name="rentAmount"
            value={form.rentAmount || ""}
            onChange={handleChange}
            placeholder="เช่น 3500"
            className="border p-2 w-full rounded"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">หน่วยน้ำ</label>
          <input
            type="number"
            name="waterUnit"
            value={form.waterUnit}
            onChange={handleChange}
            placeholder="เช่น 10"
            className="border p-2 w-full rounded"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">ราคาน้ำ/หน่วย</label>
          <input
            type="number"
            name="waterRate"
            value={form.waterRate}
            onChange={handleChange}
            placeholder="เช่น 15"
            className="border p-2 w-full rounded"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">หน่วยไฟ</label>
          <input
            type="number"
            name="electricUnit"
            value={form.electricUnit}
            onChange={handleChange}
            placeholder="เช่น 35"
            className="border p-2 w-full rounded"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">ราคาไฟ/หน่วย</label>
          <input
            type="number"
            name="electricRate"
            value={form.electricRate}
            onChange={handleChange}
            placeholder="เช่น 8.5"
            className="border p-2 w-full rounded"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          {loading ? "กำลังสร้าง..." : "สร้างบิล"}
        </button>
      </div>
    </div>
  );
}
