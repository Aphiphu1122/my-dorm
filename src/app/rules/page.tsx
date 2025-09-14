/* eslint-disable @next/next/no-img-element */
"use client";

import Sidebar from "@/components/sidebar";
import { FileText, KeyRound, CalendarDays, ShieldCheck, BellRing, Users2, Flame, DoorClosed, Trash2, Car, Ban, PhoneCall, ClipboardCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";

type Contract = {
  id: string;
  startDate: string;       // ISO
  endDate: string;         // ISO
  contractDate: string;    // ISO
  rentPerMonth: number;
  dormOwnerName: string;
  dormAddress: string;
  contractImages: string[];
};

type UserProfile = {
  roomStartDate?: string | null;
  room?: { roomNumber: string | null } | null;
  contracts?: Contract[];
};

const fmt = (iso?: string | null) =>
  iso ? dayjs(iso).format("DD/MM/YYYY") : "-";

export default function RulesContractPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/profile/me", { credentials: "include" });
        if (res.ok) {
          const data = (await res.json()) as UserProfile;
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

  // เลือก "สัญญาล่าสุด" จาก DB (ตาม startDate ที่มากที่สุด)
  const latestContract = useMemo<Contract | null>(() => {
    const list = user?.contracts ?? [];
    if (!list.length) return null;
    return list.slice().sort((a, b) => +new Date(b.startDate) - +new Date(a.startDate))[0];
  }, [user?.contracts]);

  // วันเริ่ม/สิ้นสุดสัญญา (fallback หากยังไม่มีสัญญา ใช้ roomStartDate + 1 ปี)
  const startDate =
    latestContract?.startDate ??
    (user?.roomStartDate ?? null);

  const endDate =
    latestContract?.endDate ??
    (user?.roomStartDate ? dayjs(user.roomStartDate).add(1, "year").toISOString() : null);

  const rent = latestContract?.rentPerMonth ?? null;
  const dormOwnerName = latestContract?.dormOwnerName ?? "-";
  const dormAddress = latestContract?.dormAddress ?? "-";
  const contractImages = latestContract?.contractImages ?? [];

  return (
    <div className="flex min-h-screen bg-white">
      <aside className="w-64 border-r border-gray-200 sticky top-0 h-screen">
        <Sidebar role="user" />
      </aside>

      <main className="flex-1 p-8 max-w-6xl mx-auto">
        {/* Title */}
        <div>
          <h3 className="text-3xl font-bold mb-1 text-[#0F3659]">
            กฎระเบียบและสัญญาเช่าห้องพัก
          </h3>
          <p className="text-gray-500 mb-8">
            ตรวจสอบกฎระเบียบของหอพักและรายละเอียดสัญญาเช่าที่ผูกกับบัญชีของคุณ
          </p>
        </div>

        {/* Rules Section */}
        <section className="mb-14">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
            กฎระเบียบของหอพัก
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* เงียบเสียง */}
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
              <div className="flex items-center gap-2 mb-2">
                <BellRing className="w-5 h-5 text-blue-700" />
                <h3 className="text-lg font-semibold text-blue-700">เวลาเงียบเสียง</h3>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">
                งดใช้เสียงดังระหว่างเวลา <strong>22:00–08:00 น.</strong> หลีกเลี่ยงกิจกรรมที่รบกวนผู้อื่น
                และโปรดเคารพพื้นที่ส่วนรวม
              </p>
            </div>

            {/* ชำระค่าเช่า */}
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
              <div className="flex items-center gap-2 mb-2">
                <CalendarDays className="w-5 h-5 text-blue-700" />
                <h3 className="text-lg font-semibold text-blue-700">การชำระค่าเช่า</h3>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">
                ชำระค่าเช่า <strong>ภายในวันที่ 1</strong> ของทุกเดือน
                เกิน <strong>วันที่ 5</strong> คิดค่าปรับตามที่กำหนด
                เก็บหลักฐานการชำระเงินทุกครั้ง
              </p>
            </div>

            {/* ผู้มาติดต่อ/ค้างคืน */}
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
              <div className="flex items-center gap-2 mb-2">
                <Users2 className="w-5 h-5 text-blue-700" />
                <h3 className="text-lg font-semibold text-blue-700">ผู้มาติดต่อและค้างคืน</h3>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">
                ผู้มาติดต่อให้ลงทะเบียนที่จุดรักษาความปลอดภัย
                <br />
                ห้ามค้างคืนโดยไม่ได้รับอนุญาตจากผู้ดูแลหอพัก
              </p>
            </div>

            {/* ความสะอาด/ขยะ */}
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
              <div className="flex items-center gap-2 mb-2">
                <Trash2 className="w-5 h-5 text-blue-700" />
                <h3 className="text-lg font-semibold text-blue-700">ความสะอาดและการทิ้งขยะ</h3>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">
                รักษาความสะอาดห้องและพื้นที่ส่วนกลาง
                คัดแยกขยะตามจุดที่กำหนด และทิ้งให้ตรงเวลา
              </p>
            </div>

            {/* ห้ามทำอาหาร/ของไวไฟ */}
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-5 h-5 text-blue-700" />
                <h3 className="text-lg font-semibold text-blue-700">ความปลอดภัยจากอัคคีภัย</h3>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">
                ห้ามใช้เตาแก๊ส อุปกรณ์ให้ความร้อนที่ไม่ได้มาตรฐาน
                หรือเก็บวัตถุไวไฟภายในห้องพัก
              </p>
            </div>

            {/* บัตร/กุญแจ */}
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
              <div className="flex items-center gap-2 mb-2">
                <DoorClosed className="w-5 h-5 text-blue-700" />
                <h3 className="text-lg font-semibold text-blue-700">บัตร/กุญแจและทรัพย์สิน</h3>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">
                รักษาบัตร/กุญแจให้ดี ห้ามส่งต่อให้ผู้อื่น หากสูญหายโปรดแจ้งผู้ดูแลทันที
                ผู้พักรับผิดชอบทรัพย์สินของตนเอง
              </p>
            </div>

            {/* ที่จอดรถ */}
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
              <div className="flex items-center gap-2 mb-2">
                <Car className="w-5 h-5 text-blue-700" />
                <h3 className="text-lg font-semibold text-blue-700">ที่จอดรถ</h3>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">
                จอดในจุดที่กำหนด ไม่กีดขวางทางเข้า–ออก
                กรุณาล็อครถทุกครั้ง ทางหอพักไม่รับผิดชอบความเสียหายจากการจอดผิดกฎ
              </p>
            </div>

            {/* ข้อห้าม */}
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
              <div className="flex items-center gap-2 mb-2">
                <Ban className="w-5 h-5 text-blue-700" />
                <h3 className="text-lg font-semibold text-blue-700">ข้อห้ามสำคัญ</h3>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">
                ห้ามนำสัตว์เลี้ยง บุหรี่ บุหรี่ไฟฟ้า เครื่องดื่มแอลกอฮอล์
                หรือสิ่งเสพติดเข้ามาภายในหอพัก โดยเด็ดขาด
              </p>
            </div>

            {/* เหตุฉุกเฉิน */}
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
              <div className="flex items-center gap-2 mb-2">
                <PhoneCall className="w-5 h-5 text-blue-700" />
                <h3 className="text-lg font-semibold text-blue-700">เหตุฉุกเฉิน</h3>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">
                ในกรณีฉุกเฉิน โปรดติดต่อเจ้าหน้าที่หอพักหรือหมายเลขที่ประกาศไว้ทันที
                ปฏิบัติตามแผนอพยพเมื่อมีการซ้อม/ประกาศ
              </p>
            </div>

            {/* การชดใช้ค่าเสียหาย */}
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
              <div className="flex items-center gap-2 mb-2">
                <ClipboardCheck className="w-5 h-5 text-blue-700" />
                <h3 className="text-lg font-semibold text-blue-700">ความเสียหายต่อทรัพย์สิน</h3>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">
                หากทำทรัพย์สินของหอพักชำรุดเสียหาย
                ผู้พักต้องรับผิดชอบค่าซ่อมแซม/ชดใช้ตามจริง
              </p>
            </div>
          </div>
        </section>

        {/* Contract Section */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <FileText className="w-6 h-6 text-green-600" />
            สัญญาเช่าห้องพัก (ผูกกับบัญชีของคุณ)
          </h2>

          <div className="bg-white rounded-xl shadow-md overflow-hidden divide-y divide-gray-200">
            {/* Start Date */}
            <div className="flex items-center gap-4 p-6 hover:bg-gray-50 transition">
              <CalendarDays className="w-5 h-5 text-green-500" />
              <div>
                <p className="font-medium text-gray-900">วันที่เริ่มสัญญา</p>
                <p className="text-sm text-gray-600">
                  {loading ? "กำลังโหลด..." : fmt(startDate)}
                </p>
              </div>
            </div>

            {/* End Date */}
            <div className="flex items-center gap-4 p-6 hover:bg-gray-50 transition">
              <CalendarDays className="w-5 h-5 text-red-500" />
              <div>
                <p className="font-medium text-gray-900">วันที่สิ้นสุดสัญญา</p>
                <p className="text-sm text-gray-600">
                  {loading ? "กำลังโหลด..." : fmt(endDate)}
                </p>
              </div>
            </div>

            {/* Key Terms (ดึงจาก DB) */}
            <div className="flex items-center gap-4 p-6 hover:bg-gray-50 transition">
              <KeyRound className="w-5 h-5 text-blue-500" />
              <div>
                <p className="font-medium text-gray-900">เงื่อนไขสำคัญ (จากข้อมูลสัญญา)</p>
                <p className="text-sm text-gray-600">
                  ค่าเช่ารายเดือน:{" "}
                  <strong>{rent ? rent.toLocaleString() : "-"}</strong> บาท • ผู้ให้เช่า:{" "}
                  <strong>{dormOwnerName}</strong> • ที่อยู่หอพัก: <strong>{dormAddress}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* รูปภาพสัญญา (ถ้ามี) */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">รูปภาพสัญญาที่แนบไว้</h3>
            {contractImages.length ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {contractImages.map((u, i) => (
                  <a
                    key={i}
                    href={u}
                    target="_blank"
                    rel="noreferrer"
                    className="block relative w-full aspect-[4/3] overflow-hidden rounded border group"
                    title="กดเพื่อเปิดภาพเต็ม"
                  >
                    {/* ใช้ <img> เพื่อไม่ต้องกำหนด width/height แบบ Next Image */}
                    <img
                      src={u}
                      alt={`contract-${i + 1}`}
                      className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]"
                    />
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">ยังไม่มีรูปภาพสัญญาที่แนบไว้</p>
            )}
          </div>

          {/* (ถ้ามีไฟล์ PDF กลางให้ผู้ใช้ดู) */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">ไฟล์สัญญาเช่ามาตรฐาน (PDF ตัวอย่าง)</h3>
            <iframe
              src="/สัญญาเช่าห้องพัก.pdf"
              className="w-full h-[600px] border rounded-lg shadow"
            />
          </div>
        </section>
      </main>
    </div>
  );
}
