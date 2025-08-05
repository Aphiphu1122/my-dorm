'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

type Bill = {
  id: string;
  billingMonth: string;
  totalAmount: number;
  status: 'PAID' | 'UNPAID' | 'PENDING_APPROVAL';
};

interface UserProfile {
  firstName: string;
  lastName: string;
  room: {
    roomNumber: string;
  };
  rentAmount: number;
}

export default function HomePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);

  useEffect(() => {
    const fetchProfile = async () => {
      const res = await fetch('/api/profile/me');
      if (!res.ok) return toast.error('โหลดข้อมูลผู้ใช้ไม่สำเร็จ');
      const data = await res.json();
      setUser({
        ...data.user,
        rentAmount: data.user?.room?.rentAmount ?? 3000 // fallback if missing
      });
    };

    const fetchBills = async () => {
      const res = await fetch('/api/bills');
      if (!res.ok) return toast.error('โหลดข้อมูลบิลไม่สำเร็จ');
      const data = await res.json();
      setBills(data.bills);
    };

    fetchProfile();
    fetchBills();
  }, []);

  return (
    <div className="min-h-screen bg-white text-black max-w-5xl mx-auto px-4 py-8">
    <div className="max-w-4xl mx-auto px-4 py-8 text-black">
      <h1 className="text-3xl font-bold">Hello , {user?.firstName} {user?.lastName}</h1>
      <p className="text-gray-600 mb-6">Welcome to the dormitory website</p>

      {/* Slide banner */}
      <div className="w-full h-52 overflow-hidden rounded-xl mb-8">
        <Image
          src="/dormpic.jpg" // change to your dynamic banner later
          alt="Banner"
          width={800}
          height={208}
          className="object-cover w-full h-full"
        />
      </div>

      {/* Tenant Info */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Tenant Info</h2>
        <div className="flex items-center gap-2 text-lg">
          <span>🏠</span>
          <span className="font-medium text-blue-700">Rental Agreement</span>
          <span>- Room {user?.room?.roomNumber ?? '-'} </span>
        </div>
        <div className="flex items-center gap-2 mt-2 text-lg">
          <span>💲</span>
          <span className="font-medium text-blue-700">Rent Amount : {user?.rentAmount?.toLocaleString()} Bath</span>
          <span className="text-sm text-gray-500">Due on the 5th of each month</span>
        </div>
      </div>

      {/* Payment History */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Payment History</h2>
        <div className="overflow-x-auto border rounded-md">
          <table className="min-w-full table-auto text-sm">
            <thead>     
              <tr className="bg-gray-100 text-left">
                <th className="p-3">Date</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
                {bills.map((bill) => (
                <tr key={bill.id} className="border-t">
                  <td className="p-3">
                    {new Date(bill.billingMonth).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                    })}
                  </td>
                  <td className="p-3">{bill.totalAmount.toLocaleString()} Bath</td>
                  <td className="p-3">
                    {bill.status === 'PAID' ? (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">✅ ชำระแล้ว</span>
                    ) : bill.status === 'PENDING_APPROVAL' ? (
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">⏳ รอตรวจสอบ</span>
                    ) : (
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">❌ ค้างชำระ</span>
                    )}
                  </td>
                  <td className="p-3">
                    <a
                      href={`/bills/${bill.id}`}
                      className="text-blue-600 underline text-sm hover:text-blue-800"
                    >
                      ดูรายละเอียด
                    </a>
                  </td>
                </tr>
              ))}
              {bills.length === 0 && (
                <tr>
                  <td className="p-3 text-gray-500 italic" colSpan={3}>No payment history found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </div>
  );
}
