"use client";

import Sidebar from "@/components/sidebar";
import { FileText, KeyRound, CalendarDays, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import dayjs from "dayjs";

type UserProfile = {
  roomStartDate?: string | null;
};

export default function RulesContractPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/profile/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  return (
    <div className="flex min-h-screen bg-white">
      <aside className="w-64 border-r border-gray-200 sticky top-0 h-screen">
        <Sidebar role="user" />
      </aside>

      <main className="flex-1 p-8 max-w-6xl mx-auto">
        <div className="">
          {/* Title */}
          <div>
            <h3 className="text-3xl font-bold mb-1 text-[#0F3659]">
              กฎระเบียบและสัญญาเช่าห้องพัก
            </h3>
            <p className="text-gray-500 mb-8">
              สามารถตรวจสอบกฎระเบียบของหอพักและสัญญาเช่าห้องพักได้ที่นี่
            </p>
          </div>

          {/* Rules Section */}
          <section className="mb-14">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-blue-600" />
              กฎระเบียบของหอพัก
            </h2>

            <div className="grid md:grid-cols-2 gap-6 cursor-pointer">
              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-transform duration-200">
                <h3 className="text-lg font-semibold text-blue-700 mb-2">
                  เวลาเปิด–ปิดหอพัก
                </h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  หอพักเปิดให้เข้า–ออกได้ตลอด 24 ชั่วโมง 
                  โดยขอความร่วมมืองดใช้เสียงดังระหว่างเวลา 22.00 – 08.00 น. 
                  ผู้พักอาศัยทุกท่านต้องปฏิบัติตามระเบียบอย่างเคร่งครัด 
                  และต้องย้ายออกภายในระยะเวลาที่กำหนดสิ้นสุดภาคการศึกษา
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-transform duration-200">
                <h3 className="text-lg font-semibold text-blue-700 mb-2">
                  นโยบายการชำระค่าเช่า
                </h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  ผู้พักอาศัยต้องชำระค่าเช่าภายในวันที่ 1 ของทุกเดือน 
                  หากชำระล่าช้าหลังวันที่ 5 จะมีค่าปรับตามที่กำหนด 
                  ช่องทางการชำระสามารถทำได้ผ่านระบบออนไลน์หรือเช็ค
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-transform duration-200">
                <h3 className="text-lg font-semibold text-blue-700 mb-2">
                  แนวทางการรักษาความสะอาด
                </h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  ผู้พักอาศัยต้องรับผิดชอบดูแลรักษาความสะอาดภายในห้องพัก 
                  และพื้นที่ส่วนกลางตามที่กำหนด 
                  โดยทางหอพักจะมีการตรวจสอบเป็นระยะอย่างสม่ำเสมอ
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-transform duration-200">
                <h3 className="text-lg font-semibold text-blue-700 mb-2">
                  ข้อห้ามภายในหอพัก
                </h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  ห้ามนำสัตว์เลี้ยง สิ่งเสพติด และบุหรี่เข้ามาภายในหอพัก 
                  รวมถึงห้ามกระทำการใด ๆ ที่ผิดกฎหมาย 
                  หากฝ่าฝืนอาจถูกดำเนินการให้ออกจากหอพักโดยทันที
                </p>
              </div>
            </div>
          </section>

          {/* Contract Section */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <FileText className="w-6 h-6 text-green-600" />
              สัญญาเช่าห้องพัก
            </h2>

            <div className="bg-white rounded-xl shadow-md overflow-hidden divide-y divide-gray-200">
              {/* Start Date */}
              <div className="flex items-center gap-4 p-6 hover:bg-gray-50 transition">
                <CalendarDays className="w-5 h-5 text-green-500" />
                <div>
                  <p className="font-medium text-gray-900">วันที่เริ่มสัญญา</p>
                  <p className="text-sm text-gray-600">
                    {loading
                      ? "กำลังโหลด..."
                      : user?.roomStartDate
                      ? dayjs(user.roomStartDate).format("DD/MM/YYYY")
                      : "-"}
                  </p>
                </div>
              </div>

              {/* End Date */}
              <div className="flex items-center gap-4 p-6 hover:bg-gray-50 transition">
                <CalendarDays className="w-5 h-5 text-red-500" />
                <div>
                  <p className="font-medium text-gray-900">วันที่สิ้นสุดสัญญา</p>
                  <p className="text-sm text-gray-600">
                    {loading
                      ? "กำลังโหลด..."
                      : user?.roomStartDate
                      ? dayjs(user.roomStartDate).add(1, "year").format("DD/MM/YYYY")
                      : "-"}
                  </p>
                </div>
              </div>

              {/* Key Terms */}
              <div className="flex items-center gap-4 p-6 hover:bg-gray-50 transition">
                <KeyRound className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="font-medium text-gray-900">เงื่อนไขสำคัญ</p>
                  <p className="text-sm text-gray-600">
                    ค่าเช่า: 3,000 บาท/เดือน • เงินประกัน: 3,000 บาท • ค่าน้ำ–ไฟ: รวมอยู่แล้ว
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">ไฟล์สัญญาเช่า (PDF)</h3>
              <iframe
                src="/สัญญาเช่าห้องพัก.pdf"
                className="w-full h-[600px] border rounded-lg shadow"
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
