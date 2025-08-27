"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import Image from "next/image";
import Sidebar from "@/components/sidebar";
import { toast } from "react-hot-toast";

interface MaintenanceRequest {
  id: string;
  description: string;
  status: string;
  category: string;
  imageUrls?: string[];
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
  const router = useRouter();
  const [request, setRequest] = useState<MaintenanceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!id || typeof id !== "string") return;

    const fetchRequest = async () => {
      try {
        const res = await fetch(`/api/admin/maintenance/${id}`);
        if (!res.ok) throw new Error("ไม่พบข้อมูล");
        const data = await res.json();
        setRequest(data.request);
      } catch (error) {
        console.error("Fetch request error:", error);
        toast.error("ไม่พบข้อมูลการแจ้งซ่อม");
        router.push("/admin/maintenance");
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [id, router]);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PENDING":
        return { label: "Pending", color: "text-yellow-700 bg-yellow-100" };
      case "IN_PROGRESS":
        return { label: "In Progress", color: "text-blue-700 bg-blue-100" };
      case "COMPLETED":
        return { label: "Completed", color: "text-green-700 bg-green-100" };
      case "CANCEL":
        return { label: "Cancelled", color: "text-red-700 bg-red-100" };
      default:
        return { label: "Unknown", color: "text-gray-700 bg-gray-100" };
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!request) return;

    try {
      setUpdating(true);
      const res = await fetch(`/api/admin/maintenance/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      toast.success("อัปเดตสถานะเรียบร้อยแล้ว");
      router.refresh();
    } catch {
      toast.error("อัปเดตล้มเหลว");
    } finally {
      setUpdating(false);
    }
  };

  if (loading)
    return (
      <p className="text-center mt-8 text-gray-600 dark:text-gray-300">
        กำลังโหลด...
      </p>
    );
  if (!request)
    return (
      <p className="text-center mt-8 text-red-600 dark:text-red-400">
        ไม่พบข้อมูลการแจ้งซ่อม
      </p>
    );

  const status = getStatusLabel(request.status);

   return (
    <div className="bg-white min-h-screen flex">
      <div className="w-64 border-r border-gray-200 sticky top-0 h-screen">
        <Sidebar role="admin" />
      </div>

      <main className="flex-1 max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Maintenance Detail</h1>
        <p className="text-gray-500 mb-8">Manage maintenance requests</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-blue-950 mb-3">Request Info</h2>

          <div className="rounded-lg shadow p-4 border border-gray-200">
            <div className="grid grid-cols-2 px-6 py-4 border-b border-gray-200">
              <span className="text-gray-700">Request ID</span>
              <span className="text-right text-gray-900">{request.id}</span>
            </div>
            <div className="grid grid-cols-2 px-6 py-4 border-b border-gray-200">
              <span className="text-gray-700">Date</span>
              <span className="text-right text-gray-900">
                {new Date(request.createdAt).toLocaleString("th-TH")}
              </span>
            </div>
            <div className="grid grid-cols-2 px-6 py-4 border-b border-gray-200">
              <span className="text-gray-700">Status</span>
              <span className={`inline-block text-sm font-medium px-2 py-0.5 rounded-full justify-self-end ${status.color}`}>
                {status.label}
              </span>
            </div>
            <div className="grid grid-cols-2 px-6 py-4 border-b border-gray-200">
              <span className="text-gray-700">Category</span>
              <span className="text-right text-gray-900">{request.category}</span>
            </div>
            <div className="grid grid-cols-2 px-6 py-4 border-b border-gray-200">
              <p className="text-gray-700 mb-1 font-medium">Description</p>
              <p className="text-right text-gray-900">{request.description}</p>
            </div>

            {request.imageUrls && request.imageUrls.length > 0 && (
              <div className="grid grid-cols-2 px-6 py-4 border-b border-gray-200 gap-4">
                <p className="text-gray-700 font-medium">Images</p>
                <div className="flex flex-wrap justify-end gap-4">
                  {request.imageUrls.map((url, index) => (
                    <Image
                      key={index}
                      src={url}
                      alt={`Maintenance Image ${index + 1}`}
                      width={200}
                      height={150}
                      className="rounded border"
                      unoptimized
                    />
                  ))}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 px-6 py-4 border-b border-gray-200">
              <span className="text-gray-700">Room</span>
              <span className="text-right text-gray-900">{request.room.roomNumber}</span>
            </div>
            <div className="grid grid-cols-2 px-6 py-4 border-b border-gray-200">
              <span className="text-gray-700">Reporter</span>
              <span className="text-right text-gray-900">
                {request.user.firstName} {request.user.lastName} ({request.user.email})
              </span>
            </div>
            <div className="grid grid-cols-2 px-6 py-4 ">
              <label htmlFor="status" className="text-gray-700 ">
                Update status :
              </label>
              <select
                id="status"
                className="border border-gray-400 px-4 py-2 rounded text-gray-900 w-full max-w-sm justify-self-end"
                value={request.status}
                onChange={(e) => handleUpdateStatus(e.target.value)}
                disabled={updating}
              >
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCEL">Cancelled</option>
              </select>
            </div>
          </div>
    

          <div>
            
          </div>
        </section>

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => router.back()}
            className="inline-block px-8 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition duration-200 transform hover:scale-105"
          > Back
          </button>
        </div>
      </main>
    </div>
  );
}