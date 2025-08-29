"use client";

import { useEffect, useState } from "react";
import PrintButton from "@/components/PrintButton";
import { useParams } from "next/navigation";
import dayjs from "dayjs";

type Bill = {
  id: string;
  status: string;
  createdAt: string;
  rentAmount: number;
  waterUnit: number;
  waterRate: number;
  electricUnit: number;
  electricRate: number;
  totalAmount: number;
  transactionRef?: string;
  paymentDate?: string;
  billingMonth?: string;
  tenant: {
    firstName: string;
    lastName: string;
  };
  room: {
    roomNumber: string;
  };
};

// ฟังก์ชันแปลงจำนวนเงินเป็นตัวหนังสือไทย
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

export default function ReceiptPrintPage() {
  const { id } = useParams();
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBill = async () => {
      try {
        const res = await fetch(`/api/admin/bills/${id}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch bill");
        const data = await res.json();
        setBill(data.bill);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchBill();
  }, [id]);

  useEffect(() => {
    if (!loading && bill) {
      setTimeout(() => window.print(), 300);
    }
  }, [loading, bill]);

  if (loading) return <p className="text-center mt-6">กำลังโหลด...</p>;
  if (!bill) return <p className="text-center mt-6">ไม่พบข้อมูลบิล</p>;

  const waterTotal = bill.waterUnit * bill.waterRate;
  const electricTotal = bill.electricUnit * bill.electricRate;
  const totalText = numberToThaiText(bill.totalAmount);

  const billingMonth = bill.billingMonth
    ? dayjs(bill.billingMonth).format("MMMM YYYY")
    : bill.paymentDate
    ? dayjs(bill.paymentDate).format("MMMM YYYY")
    : "-";

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
          <h1 className="text-xl font-extrabold mt-1">ใบเสร็จการชำระเงิน / Payment receipt</h1>
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

            <td colSpan={4} className="align-top text-right ">
              <table className="w-full text-sm border-collapse">
                <tbody className="border-l border-gray-300">
                  <tr>
                    <div className="justify-between flex">
                        <p className="text-center font-lg ">วันที่ชำระ</p>
                          <p>{" "}{bill.paymentDate ? new Date(bill.paymentDate).toLocaleString("th-TH") : "-"}</p>
                      </div>

                      <div className="justify-between flex">
                        <p>ห้องพัก</p>
                        <p>{bill.room.roomNumber}</p>
                      </div>

                      <div className="justify-between flex">
                        <p>รหัสธุรกรรม</p>
                        <p>{bill.transactionRef}</p>
                      </div>
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
            <th className="border border-gray-300 p-2 w-8 text-center">ลำดับ<br/>item</th>
            <th className="border border-gray-300 p-2  text-center">รายการ <br />Description</th>
            <th className="border border-gray-300 p-2 w-28 text-center">จำนวนหน่วย <br /> Qty</th>
            <th className="border border-gray-300 p-2 w-28 text-center">ราคาต่อหน่วย <br />Unit Price</th>
            <th className="border border-gray-300 p-2  w-28 text-center">จำนวนเงิน <br />Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-gray-300 p-2 w-12 text-center border-b-white">1</td>
            <td className="border border-gray-300 p-2 border-b-white">ค่าเช่าห้อง {billingMonth}</td>
            <td className="border border-gray-300 p-2 text-center border-b-white"></td>
            <td className="border border-gray-300 p-2 text-center border-b-white"></td>
            <td className="border border-gray-300 p-2 text-right border-b-white">{bill.rentAmount.toFixed(2)}</td>
          </tr>
          <tr>
            <td className="border border-gray-300 p-2 w-12 text-center border-b-white">2</td>
            <td className="border border-gray-300 p-2 border-b-white">ค่าน้ำ {billingMonth}</td>
            <td className="border border-gray-300 p-2 text-center border-b-white">{bill.waterUnit}</td>
            <td className="border border-gray-300 p-2 text-center border-b-white">{bill.waterRate.toFixed(2)}</td>
            <td className="border border-gray-300 p-2 text-right border-b-white">{waterTotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td className="border border-gray-300 p-2 w-12 text-center">3</td>
            <td className="border border-gray-300 p-2">ค่าไฟฟ้า {billingMonth}</td>
            <td className="border border-gray-300 p-2 text-center">{bill.electricUnit}</td>
            <td className="border border-gray-300 p-2 text-center">{bill.electricRate.toFixed(2)}</td>
            <td className="border border-gray-300 p-2 text-right">{electricTotal.toFixed(2)}</td>
          </tr>
           <tr>
            <td colSpan={2} className="p-2 text-center  text-black  ">
            ({totalText})
          </td >
            <td colSpan={2} className="p-l2 text-center font-bold border-l border--gray-300 border-r border-gray-300 text-black">จำนวนเงินรวม</td>
            <td className="p-2 text-end font-bold text-black text-md">{bill.totalAmount.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      {/* Footer */}
      <div className="flex justify-between mt-12 text-sm">
        <div className="text-left ml-15 justify-between flex">
          <p>ผู้รับเงิน <br /> Collector</p>
          <p className="mt-2 ml-8">........................................</p>
        </div>
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
