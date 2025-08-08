import { notFound } from "next/navigation";
import { headers, cookies } from "next/headers";
import Link from "next/link";
import Sidebar from "@/components/sidebar";

type RoomDetail = {
  id: string;
  roomNumber: string;
  status: string;
  tenant: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  } | null;
};

async function getRoom(id: string): Promise<RoomDetail | null> {
  const baseUrl = (await headers()).get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";

  const cookieStore = cookies(); // สำคัญ: ต้องใช้ cookies() ตรงนี้
  const cookieHeader = cookieStore.toString(); // แปลง cookies เป็น header string

  const res = await fetch(`${protocol}://${baseUrl}/api/admin/rooms/${id}`, {
    cache: "no-store",
    headers: {
      Cookie: cookieHeader,
    },
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data.room;
}

export default async function RoomDetailPage({ params }: { params: { id: string } }) {
  const room = await getRoom(params.id);

  if (!room) return notFound();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role="admin" />


      {/* main */}
      <div className="flex-1 p-8 max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 ">Room {room.roomNumber}</h1>
          <p className="text-gray-500 mb-8">Manage room information</p>

          <p className="mb-8">
            <h2 className="text-xl font-semibold text-blue-950 mb-2">Room Info</h2>
           
              <div className="rounded-lg shadow p-6 border border-gray-200 grid grid-cols-2">
              <span className="text-gray-700 font-medium">Status</span>
              <span className="text-right text-gray-900">
                {room.status === "OCCUPIED"
                  ? "Occupied" 
                  : room.status === "AVAILABLE"
                  ? "Available"
                  : "Maintenance"}
              </span>
            </div>
          </p>
            
        

          {room.tenant ? (
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-blue-950 mb-2">Tenant information</h2>
              <p>
                <strong>Name :</strong> {room.tenant.firstName} {room.tenant.lastName}
              </p>
              <p>
                <strong>Email :</strong> {room.tenant.email}
              </p>
              <p>
                <strong>Phone number:</strong> {room.tenant.phone ?? "-"}
              </p>
            </div>
          ) : (
            <p className="text-gray-500 italic">ไม่มีผู้เช่าในห้องนี้</p>
          )}

          <div className="mt-6">
            <Link href="/admin/rooms">
              <button className=" inline-block bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 text-sm transition duration-200 transform hover:scale-105">
                 Back to All Room
              </button>
            </Link>
          </div>
        </div>
      </div>
  );
}
