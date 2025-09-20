"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import Sidebar from "@/components/sidebar";

/* ================= Types ================= */
type RoomStatus = "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";

type TenantMini = {
  firstName?: string;
  lastName?: string;
  email?: string;
} | null;

type Room = {
  id: string;
  roomNumber: string;
  status: RoomStatus;
  tenant?: TenantMini;
};

type ApiRoom = {
  id: string;
  roomNumber: string;
  status: RoomStatus;
  tenant?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  } | null;
};

type RoomsIndexApi = { rooms: ApiRoom[] };

function isRoomsIndexApi(x: unknown): x is RoomsIndexApi {
  return (
    typeof x === "object" &&
    x !== null &&
    "rooms" in x &&
    Array.isArray((x as { rooms: unknown[] }).rooms)
  );
}

/* ================= Page ================= */
export default function RoomManagementPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRoomNumber, setNewRoomNumber] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | RoomStatus>("ALL");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/rooms", { credentials: "include" });
      const data: unknown = await res.json();

      if (res.ok && isRoomsIndexApi(data)) {
        const mapped: Room[] = data.rooms.map((r) => ({
          id: r.id,
          roomNumber: r.roomNumber,
          status: r.status,
          tenant: r.tenant
            ? {
              firstName: r.tenant.firstName,
              lastName: r.tenant.lastName,
              email: r.tenant.email,
            }
            : null,
        }));
        setRooms(mapped);
      } else {
        console.warn("❗️โครงสร้าง response ไม่ถูกต้อง:", data);
        toast.error("ข้อมูลห้องไม่ถูกต้อง");
        setRooms([]);
      }
    } catch (error) {
      console.error("❌ โหลดข้อมูลห้องล้มเหลว:", error);
      toast.error("โหลดข้อมูลห้องล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  // หมายเลขห้องต้องเป็นตัวเลขล้วน
  const isValidRoomNumber = /^\d+$/.test(newRoomNumber);

  const handleAddRoom = async () => {
    if (!newRoomNumber.trim()) {
      toast.error("กรุณากรอกหมายเลขห้อง");
      return;
    }
    if (!isValidRoomNumber) {
      toast.error("หมายเลขห้องต้องเป็นตัวเลขเท่านั้น (0-9)");
      return;
    }

    const res = await fetch("/api/admin/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ roomNumber: newRoomNumber }),
    });

    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (res.ok) {
      setNewRoomNumber("");
      toast.success("เพิ่มห้องสำเร็จ");
      fetchRooms();
    } else {
      toast.error(`ไม่สามารถเพิ่มห้องได้: ${data?.error ?? "Unknown error"}`);
    }
  };

  const requestDelete = (room: Room) => {
    if (room.status === "OCCUPIED") {
      toast.error("ห้องนี้มีผู้เช่าอยู่ ไม่สามารถลบได้");
      return;
    }
    setSelectedRoom(room);
    setShowDeleteModal(true);
  };

  const handleDeleteRoom = async (roomId: string, roomNumber: string) => {
    setDeleting(true);
    const res = await fetch(`/api/admin/rooms/${roomId}`, {
      method: "DELETE",
      credentials: "include",
    });
    setDeleting(false);
    setShowDeleteModal(false);

    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (res.ok) {
      toast.success(`ลบห้อง ${roomNumber} สำเร็จ`);
      fetchRooms();
    } else {
      toast.error(`ลบห้องไม่สำเร็จ: ${data?.error ?? "Unknown error"}`);
    }
  };

  // กัน set เป็น AVAILABLE ขณะมีผู้เช่า
  const handleStatusChange = async (room: Room, newStatus: RoomStatus) => {
    if (room.status === "OCCUPIED" && newStatus === "AVAILABLE" && room.tenant) {
      toast.error("ไม่สามารถตั้งเป็น Available ได้ เนื่องจากมีผู้เช่าอยู่");
      return;
    }

    const res = await fetch(`/api/admin/rooms/${room.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status: newStatus }),
    });

    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (res.ok) {
      toast.success("อัปเดตสถานะเรียบร้อย");
      fetchRooms();
    } else {
      toast.error(`อัปเดตสถานะไม่สำเร็จ: ${data?.error ?? "Unknown error"}`);
    }
  };

  const filteredRooms = useMemo(() => {
    if (filterStatus === "ALL") return rooms;
    return rooms.filter((room) => room.status === filterStatus);
  }, [rooms, filterStatus]);

  return (
    <>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <Sidebar role="admin" />

        {/* Main */}
        <div className="flex-1 p-8 max-w-6xl mx-auto">
          <Toaster position="top-right" />

          <div className="w-full">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6 px-4 md:px-6">
              <div>
                <h1 className="text-3xl font-bold text-[#0F3659]">จัดการห้องพัก</h1>
                <p className="text-gray-600">จัดการห้องพักและสถานะ</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center gap-2">
                  <label htmlFor="filter" className="font-medium text-gray-700 whitespace-nowrap">
                    สถานะ:
                  </label>
                  <select
                    id="filter"
                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as "ALL" | RoomStatus)}
                  >
                    <option value="ALL">ทั้งหมด</option>
                    <option value="AVAILABLE">ว่าง</option>
                    <option value="OCCUPIED">มีผู้เช่า</option>
                    <option value="MAINTENANCE">ซ่อมบำรุง</option>
                  </select>
                </div>

                {/* Add Room */}
                <div className="flex flex-col sm:flex-row gap-2 sm:items-start">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="\d*"
                    maxLength={4}
                    className="border border-gray-300 rounded-md px-4 py-2 w-full sm:w-52 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="หมายเลขห้อง"
                    value={newRoomNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setNewRoomNumber(value);
                    }}
                  />
                  <button
                    className="bg-blue-500 text-white px-5 py-2 rounded-md hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleAddRoom}
                    disabled={!newRoomNumber || !isValidRoomNumber}
                  >
                    + เพิ่มห้อง
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#0F3659] border-b-transparent border-solid" />
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="py-16 text-center text-gray-600">ไม่มีห้องที่ตรงกับเงื่อนไข</div>
            ) : (
              <div className="px-4 md:px-2">
                <div className="grid [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))] gap-4 ">
                  {filteredRooms.map((room) => {
                    const isOccupied = room.status === "OCCUPIED";
                    const isMaint = room.status === "MAINTENANCE";
                    const cardClass =
                      isOccupied
                        ? "bg-[#88D64C] text-white"
                        : isMaint
                        ? "bg-[#FFAE00] text-white"
                        : "bg-gray-200 text-gray-900";

                    const tenantName =
                      room.tenant && (room.tenant.firstName || room.tenant.lastName)
                        ? `${room.tenant.firstName ?? ""} ${room.tenant.lastName ?? ""}`.trim()
                        : null;

                    return (
                      <div
                        key={room.id}
                        className={`relative rounded-lg p-4 shadow-md transition-transform duration-300 cursor-pointer hover:scale-105 hover:shadow-lg ${cardClass}`}
                      >
                        {/* delete */}
                        <button
                          onClick={() => requestDelete(room)}
                          className="absolute top-2 right-2 bg-black/20 hover:bg-black/40 text-white rounded-full w-7 h-7 flex items-center justify-center text-lg font-bold transition"
                          aria-label={`Delete room ${room.roomNumber}`}
                          title="Delete"
                        >
                          ×
                        </button>

                        <Link href={`/admin/rooms/${room.id}`}>
                          <div className="font-extrabold text-xl cursor-pointer">{room.roomNumber}</div>
                        </Link>

                        <div className="text-sm mt-2">
                          <div>
                            สถานะ:{" "}
                            {room.status === "AVAILABLE"
                              ? "ว่าง"
                              : room.status === "OCCUPIED"
                              ? "มีผู้เช่า"
                              : "ซ่อมบำรุง"}
                          </div>

                          {tenantName || room.tenant?.email ? (
                            <div className="mt-1">
                              Tenant:{" "}
                              <span className="font-semibold">{tenantName ?? "-"}</span>
                              {room.tenant?.email ? (
                                <> <a className="underline" href={`mailto:${room.tenant.email}`}>
                                  ({room.tenant.email})
                                </a></>
                              ) : null}
                            </div>
                          ) : null}
                        </div>

                        <select
                          className="mt-3 text-black bg-white/90 p-2 rounded-md w-full"
                          value={room.status}
                          onChange={(e) => handleStatusChange(room, e.target.value as RoomStatus)}
                        >
                          <option value="AVAILABLE">ว่าง</option>
                          <option value="OCCUPIED">มีผู้เช่า</option>
                          <option value="MAINTENANCE">ซ่อมบำรุง</option>
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete modal */}
      {showDeleteModal && selectedRoom && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="bg-white p-6 rounded-lg max-w-sm w-full text-center shadow-xl border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4">
              คุณต้องการลบห้อง {selectedRoom.roomNumber} ใช่หรือไม่?
            </h2>
            <div className="flex justify-center gap-3">
              <button
                className={`bg-[#0F3659] text-white px-4 py-2 rounded hover:transition duration-200 transform hover:scale-105  ${
                  deleting ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={() => handleDeleteRoom(selectedRoom.id, selectedRoom.roomNumber)}
                disabled={deleting}
              >
                {deleting ? "⏳ กำลังลบ..." : "Confirm"}
              </button>
              <button
                className="bg-gray-200 text-gray-900 px-4 py-2 rounded hover:transition duration-200 transform hover:scale-105"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
