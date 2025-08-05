import { notFound } from "next/navigation";
import { headers, cookies } from "next/headers";
import Link from "next/link";

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
    <div className="max-w-xl mx-auto mt-8 bg-white p-6 rounded shadow text-black">
      <h1 className="text-2xl font-bold mb-4">ข้อมูลห้อง {room.roomNumber}</h1>

      <p className="mb-2">
        <strong>สถานะ:</strong>{" "}
        {room.status === "OCCUPIED"
          ? "มีผู้เช่า"
          : room.status === "AVAILABLE"
          ? "ว่าง"
          : "กำลังซ่อม"}
      </p>

      {room.tenant ? (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold mb-2">ข้อมูลผู้เช่า</h2>
          <p>
            <strong>ชื่อ:</strong> {room.tenant.firstName} {room.tenant.lastName}
          </p>
          <p>
            <strong>อีเมล:</strong> {room.tenant.email}
          </p>
          <p>
            <strong>เบอร์โทร:</strong> {room.tenant.phone ?? "-"}
          </p>
        </div>
      ) : (
        <p className="text-gray-500 italic">ไม่มีผู้เช่าในห้องนี้</p>
      )}

      <div className="mt-6">
        <Link href="/admin/rooms">
          <button className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 text-sm">
            ← กลับไปหน้าห้องทั้งหมด
          </button>
        </Link>
      </div>
    </div>
  );
}
