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
    <div className="max-w-xl mx-auto bg-white text-black p-6 print:p-0 print:shadow-none">
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold">ใบเสร็จการชำระเงิน</h1>
        <p className="text-sm">รหัสบิล: {bill.id}</p>
        <p className="text-sm">
          วันที่ชำระ:{" "}
          {bill.paymentDate
            ? new Date(bill.paymentDate).toLocaleString("th-TH")
            : "-"}
        </p>
      </div>

      <div className="space-y-2 text-sm">
        <p>👤 ผู้เช่า: {bill.tenant.firstName} {bill.tenant.lastName}</p>
        <p>🏠 ห้องพัก: {bill.room.roomNumber}</p>
        <p>💧 ค่าน้ำ: {bill.waterUnit} x {bill.waterRate} = {waterTotal.toLocaleString()} บาท</p>
        <p>⚡ ค่าไฟ: {bill.electricUnit} x {bill.electricRate} = {electricTotal.toLocaleString()} บาท</p>
        <p>💵 ค่าเช่า: {bill.rentAmount.toLocaleString()} บาท</p>
        <hr className="my-2" />
        <p className="font-bold text-lg">💰 รวมทั้งหมด: {bill.totalAmount.toLocaleString()} บาท</p>
        {bill.transactionRef && <p>🔖 รหัสธุรกรรม: {bill.transactionRef}</p>}
      </div>

      <p className="mt-6 text-xs text-gray-500 print:mt-8">
        * เอกสารนี้ใช้สำหรับเป็นหลักฐานการชำระเงินเท่านั้น
      </p>

      {/* ปุ่มพิมพ์จะไม่แสดงตอนพิมพ์ */}
      <div className="mt-6 print:hidden">
        <PrintButton />
      </div>
    </div>
  );
}
