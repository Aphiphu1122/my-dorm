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
          ? value === ""
            ? ""
            : parseFloat(value)
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
    } else {
      setForm((prev) => ({
        ...prev,
        tenantId: "",
        roomId: "",
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

  const isFormValid = () => {
  return (
    form.tenantId &&
    form.roomId &&
    form.billingMonth &&
    form.rentAmount > 0 &&
    form.waterUnit >= 0 &&
    form.waterRate > 0 &&
    form.electricUnit >= 0 &&
    form.electricRate > 0
  );
};

  return (
    <div className="max-w-xl mx-auto mt-6 p-8 bg-white rounded-xl shadow-lg border border-gray-200">
      <h1 className="text-3xl font-bold text-[#0F3659] mb-8 text-center">
        Creating new bill
      </h1>

      <div className="space-y-6">
        <div>
          <label className="block text-gray-700 font-semibold mb-2">
            Select Tenant
          </label>
          <select
            name="tenantId"
            value={form.tenantId}
            onChange={handleTenantSelect}
            className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          >
            <option value="">-- Select Tenant --</option>
            {tenantRooms.map((room) => (
              <option key={room.tenantId} value={room.tenantId}>
                {room.tenant.firstName} {room.tenant.lastName} (ห้อง{" "}
                {room.roomNumber})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-gray-700 font-semibold mb-2">
            Billing Month
          </label>
          <input
            type="month"
            name="billingMonth"
            value={form.billingMonth}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-3 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-semibold mb-2">
            Rent
          </label>
          <input
            type="number"
            name="rentAmount"
            value={form.rentAmount || ""}
            onChange={handleChange}
            placeholder="e.g. 3500"
            min={0}
            className="w-full border border-gray-300 rounded-md p-3 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Water Units
            </label>
            <input
              type="number"
              name="waterUnit"
              value={form.waterUnit || ""}
              onChange={handleChange}
              placeholder="e.g. 10"
              min={0}
              className="w-full border border-gray-300 rounded-md p-3 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Water Rate
            </label>
            <input
              type="number"
              name="waterRate"
              value={form.waterRate || ""}
              onChange={handleChange}
              placeholder="e.g. 15"
              min={0}
              step={0.01}
              className="w-full border border-gray-300 rounded-md p-3 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Electricity Unit
            </label>
            <input
              type="number"
              name="electricUnit"
              value={form.electricUnit || ""}
              onChange={handleChange}
              placeholder="e.g. 35"
              min={0}
              className="w-full border border-gray-300 rounded-md p-3 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Electricity Rate
            </label>
            <input
              type="number"
              name="electricRate"
              value={form.electricRate || ""}
              onChange={handleChange}
              placeholder="e.g. 8.5"
              min={0}
              step={0.01}
              className="w-full border border-gray-300 rounded-md p-3 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={() => router.push("/admin/bills")}
            type="button"
            className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-semibold py-3 rounded-md shadow-lg transition-transform duration-200 ease-in-out transform hover:scale-105"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={!isFormValid() || loading}
            className={`flex-1 text-white font-semibold py-3 rounded-md shadow-lg transition-transform duration-200 ease-in-out transform hover:scale-105
              ${
                !isFormValid()
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              } ${loading ? "opacity-50" : ""}
            `}
          >
            {loading ? "Creating..." : "Create Bill"}
          </button>
        </div>
      </div>
    </div>
  );
}
