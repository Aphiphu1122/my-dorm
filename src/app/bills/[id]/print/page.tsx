// app/bills/[id]/print/page.tsx
import { db } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PrintButton from "@/components/PrintButton";

export default async function BillPrintPage({ params }: { params: { id: string } }) {
  const bill = await db.bill.findUnique({
    where: { id: params.id },
    include: {
      tenant: true,
      room: true,
    },
  });

  if (!bill || bill.status !== "PAID") return notFound();

  const waterTotal = bill.waterUnit * bill.waterRate;
  const electricTotal = bill.electricUnit * bill.electricRate;

  return (
    <div className="max-w-3xl mx-auto bg-white text-black p-8 mt-10 rounded-lg shadow-md print:shadow-none print:p-4 print:rounded-none border border-gray-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4 mb-6">
        <div className="flex items-center gap-3">
          {/* โลโก้ (เปลี่ยน path ได้) */}
          <h2 className="text-2xl font-bold text-[#0F3659] mb-6 flex items-center gap-4">
        <span
          className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-[#0F3659] bg-[#0F3659]"
          aria-hidden="true"
        >
          <i className="ri-home-heart-fill text-white text-xl"></i>
        </span>
      </h2>
        
          <div>
            <h1 className="text-xl font-extrabold text-[#0F3659]">
              Dorm
            </h1>
            <p className="text-xs text-gray-600">
              123 หมู่ 4 ต.แม่กา อ.เมือง จ.พะเยา 56000 <br />
              Tel. 093-6403500
            </p>
          </div>
        </div>
        <div className="text-right text-sm">
          <p className="font-semibold">ใบเสร็จรับเงิน</p>
          <p className="text-gray-600">เลขที่บิล: {bill.id}</p>
          <p className="text-gray-600">
            วันที่ชำระ:{" "}
            {bill.paymentDate
              ? new Date(bill.paymentDate).toLocaleDateString("th-TH")
              : "-"}
          </p>
        </div>
      </div>

      {/* Tenant Info */}
      <div className="mb-6">
        <table className="w-full text-sm border border-gray-300">
          <tbody>
            <tr className="bg-gray-50">
              <td className="p-2 border border-gray-300 w-1/3 font-semibold">
                ผู้เช่า
              </td>
              <td className="p-2 border border-gray-300">
                {bill.tenant.firstName} {bill.tenant.lastName}
              </td>
            </tr>
            <tr>
              <td className="p-2 border border-gray-300 font-semibold">
                ห้องพัก
              </td>
              <td className="p-2 border border-gray-300">
                {bill.room.roomNumber}
              </td>
            </tr>
            {bill.transactionRef && (
              <tr>
                <td className="p-2 border border-gray-300 font-semibold">
                  รหัสธุรกรรม
                </td>
                <td className="p-2 border border-gray-300">
                  {bill.transactionRef}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Bill Details */}
      <div className="mb-6">
        <table className="w-full text-sm border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border border-gray-300 text-left">รายละเอียด</th>
              <th className="p-2 border border-gray-300 text-right">จำนวน</th>
              <th className="p-2 border border-gray-300 text-right">ราคา/หน่วย</th>
              <th className="p-2 border border-gray-300 text-right">รวม (บาท)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-2 border border-gray-300">ค่าเช่าห้อง</td>
              <td className="p-2 border border-gray-300 text-right">-</td>
              <td className="p-2 border border-gray-300 text-right">-</td>
              <td className="p-2 border border-gray-300 text-right">
                {bill.rentAmount.toLocaleString()}
              </td>
            </tr>
            <tr>
              <td className="p-2 border border-gray-300">ค่าน้ำ</td>
              <td className="p-2 border border-gray-300 text-right">
                {bill.waterUnit}
              </td>
              <td className="p-2 border border-gray-300 text-right">
                {bill.waterRate}
              </td>
              <td className="p-2 border border-gray-300 text-right">
                {waterTotal.toLocaleString()}
              </td>
            </tr>
            <tr>
              <td className="p-2 border border-gray-300">ค่าไฟฟ้า</td>
              <td className="p-2 border border-gray-300 text-right">
                {bill.electricUnit}
              </td>
              <td className="p-2 border border-gray-300 text-right">
                {bill.electricRate}
              </td>
              <td className="p-2 border border-gray-300 text-right">
                {electricTotal.toLocaleString()}
              </td>
            </tr>
            <tr className="bg-gray-50 font-bold text-[#0F3659]">
              <td
                className="p-2 border border-gray-300 text-right"
                colSpan={3}
              >
                รวมทั้งหมด
              </td>
              <td className="p-2 border border-gray-300 text-right text-lg">
                {bill.totalAmount.toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center mt-10">
        <p className="text-xs text-gray-500">
          * เอกสารนี้ใช้สำหรับเป็นหลักฐานการชำระเงินเท่านั้น *
        </p>
        <div className="text-center text-sm">
          <p>........................................</p>
          <p className="mt-1">ลงชื่อผู้รับเงิน</p>
        </div>
      </div>

      {/* Print Button */}
      <div className="mt-6 flex justify-center print:hidden">
        <PrintButton />
      </div>
    </div>
  );
}