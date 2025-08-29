// app/bills/[id]/print/page.tsx
import { db } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PrintButton from "@/components/PrintButton";
import dayjs from "dayjs";

function numberToThaiText(amount: number): string {
  const thNumber = ["ศูนย์","หนึ่ง","สอง","สาม","สี่","ห้า","หก","เจ็ด","แปด","เก้า"];
  const thPosition = ["","สิบ","ร้อย","พัน","หมื่น","แสน","ล้าน"];
  const numStr = amount.toFixed(2).split(".")[0]; 
  let text = "";
  const len = numStr.length;

  for (let i = 0; i < len; i++) {
    const digit = parseInt(numStr.charAt(i));
    if (digit !== 0) {
      if (i === len - 1 && digit === 1 && len > 1) {
        text += "เอ็ด";
      } else if (i === len - 2 && digit === 2) {
        text += "ยี่";
      } else if (i === len - 2 && digit === 1) {
        text += "";
      } else {
        text += thNumber[digit];
      }
      text += thPosition[len - i - 1];
    }
  }
  return text + "บาทถ้วน";
}

export default async function BillPrintPage({ params }: { params: { id: string } }) {
  const bill = await db.bill.findUnique({
    where: { id: params.id },
    include: {
      tenant: true,
      room: true,
    },
  });

  if (!bill || bill.status !== "PAID") return notFound();

  const billingMonth = dayjs(bill.billingMonth).format("MMMM YYYY");

  const waterTotal = bill.waterUnit * bill.waterRate;
  const electricTotal = bill.electricUnit * bill.electricRate;
  const totalText = numberToThaiText(bill.totalAmount);

  return (
    <div className="max-w-4xl mx-auto bg-white text-black p-8 mt-6 rounded-lg shadow-md print:shadow-none print:p-4 border border-gray-300">
      {/* Header */}
      <div className="flex items-center mb-6">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-[#0F3659] bg-[#0F3659]">
            <i className="ri-home-heart-fill text-white text-xl"></i>
          </span>
          <h2 className="text-xl font-bold text-[#0F3659]">Dorm</h2>
        </div>
        <div className="flex-1 text-center">
          <h2 className="text-lg font-bold">My dorm</h2>
          <p className="text-sm">University of Phayao, Mae Ka Subdistrict, Mueang District, Phayao Province 56000</p>
          <h1 className="text-xl font-extrabold mt-1">ใบเสร็จรับเงิน / <strong>Receipt</strong></h1>
        </div>
      </div>

      {/* Tenant Info */}
      <table className="w-full text-sm border border-gray-300 border-b-white border-collapse">
        <tbody>
          <tr>
            <td colSpan={3} className="align-center ">
              <div className="justify-between flex">
                <p><span className="font-lg ml-5 ">ชื่อ / Name: </span> </p>
                <p className="pr-5">{bill.tenant.firstName} {bill.tenant.lastName}</p>
              </div>
              <div className="justify-between flex">
                <p><span className="font-lg ml-5 ">ที่อยู่ / Address:</span></p>
                <p className="pr-5">19 หมู่ 2 ต.แม่กา อ.เมือง จ.พะเยา 56000</p>
              </div>
            </td>
            <td colSpan={4} className="align-top text-right">
              <table className="w-full text-sm border-collapse">
                <tbody className="border-l border-gray-300">
                  <tr className="border-b border-gray-300 ">
                    <td colSpan={3} className="text-center  font-lg">เลขที่ NO</td>
                    <td colSpan={4} className="text-right border-l border-gray-300">{bill.id}</td>
                  </tr>
                  <tr className="border-b border-gray-300 ">
                    <td colSpan={3} className="text-center font-lg ">วันที่ Date</td>
                    <td colSpan={4} className="text-right border-l border-l-gray-300">{bill.paymentDate ? new Date(bill.paymentDate).toLocaleDateString("th-TH") : "-"}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="text-center font-lg">ห้อง Room</td>
                    <td colSpan={4} className="text-right border-l border-l-gray-300">{bill.room?.roomNumber ?? "-"}</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Bill Details Table */}
      <table className="w-full text-sm border border-gray-300 border-collapse mb-6">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 p-2">ลำดับ<br/>item</th>
            <th className="border border-gray-300 p-2 text-center">รายการ<br/>Description</th>
            <th className="border border-gray-300 p-2">จำนวนหน่วย<br/>Qty</th>
            <th className="border border-gray-300 p-2">ราคาต่อหน่วย<br/>Unit Price</th>
            <th className="border border-gray-300 p-2">จำนวนเงิน<br/>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-gray-300 p-2 text-center border-b-white">1</td>
            <td className="border border-gray-300 p-2 border-b-white">ค่าเช่าห้อง {billingMonth}</td>
            <td className="border border-gray-300 p-2 text-center border-b-white"></td>
            <td className="border border-gray-300 p-2 text-center border-b-white"></td>
            <td className="border border-gray-300 p-2 text-right border-b-white">{bill.rentAmount.toFixed(2)}</td>
          </tr>
          <tr>
            <td className="border border-gray-300 p-2 text-center border-b-white">2</td>
            <td className="border border-gray-300 p-2 border-b-white">ค่าน้ำ {billingMonth}</td>
            <td className="border border-gray-300 p-2 text-center border-b-white">{bill.waterUnit}</td>
            <td className="border border-gray-300 p-2 text-center border-b-white">{bill.waterRate.toFixed(2)}</td>
            <td className="border border-gray-300 p-2 text-right border-b-white">{waterTotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td className="border border-gray-300 p-2 text-center">3</td>
            <td className="border border-gray-300 p-2">ค่าไฟฟ้า {billingMonth}</td>
            <td className="border border-gray-300 p-2 text-center">{bill.electricUnit}</td>
            <td className="border border-gray-300 p-2 text-center">{bill.electricRate.toFixed(2)}</td>
            <td className="border border-gray-300 p-2 text-right">{electricTotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td className="p-2 text-left  text-black  ">
            ({totalText})
          </td >
            <td colSpan={2} className="p-l2 text-center font-bold border-l border--gray-300 border-r border-gray-300 text-black">จำนวนเงินรวม</td>
            <td className="p-2 text-end font-bold text-black text-md">{bill.totalAmount.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      {/* Footer */}
        <div className="flex justify-between mt-12 text-sm">
          {/* Left side */}
          <div className="text-left ml-15 justify-between flex">
            <p>ผู้รับเงิน <br /> Collector</p>
            <p className="mt-2 ml-8">........................................</p>
          </div>

          {/* Right side */}
          <div className="text-right mr-15  justify-between flex">
            <p>วันที่ <br /> Date</p>
            <p className="mt-2 ml-8">.........../........../..........</p>
          </div>
        </div>

      {/* Note */}
      <p className="text-xs text-gray-500 mt-4 text-center">
        * เอกสารนี้ใช้สำหรับเป็นหลักฐานการชำระเงินเท่านั้น *
      </p>

      {/* Print Button */}
      <div className="mt-6 flex justify-center print:hidden">
        <PrintButton />
      </div>
    </div>
  );
}
