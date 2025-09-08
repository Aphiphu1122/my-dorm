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
          <h3 className="text-3xl font-bold mb-1 text-[#0F3659]">Regulations & Rental Contract</h3>
          <p className="text-gray-500 mb-8">See the dormitory rules and rental contract here.</p>
        </div>
 
          {/* Rules Section */}
          <section className="mb-14">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-blue-600" />
              Rules & Regulations
            </h2>
 
            <div className="grid md:grid-cols-2 gap-6 cursor-pointer">
              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-transform duration-200">
                <h3 className="text-lg font-semibold text-blue-700 mb-2">Opening/Closing Times</h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  The dormitory is open 24/7, but quiet hours are from 10 PM to 8 AM.
                  All residents must be out of the building by the end of the academic year.
                </p>
              </div>
 
              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-transform duration-200">
                <h3 className="text-lg font-semibold text-blue-700 mb-2">Payment Policies</h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Rent is due on the 1st of each month. Late fees apply after the 5th.
                  Accepted payment methods include online transfers and checks.
                </p>
              </div>
 
              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-transform duration-200">
                <h3 className="text-lg font-semibold text-blue-700 mb-2">Cleanliness Guidelines</h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Residents are responsible for maintaining the cleanliness of their rooms
                  and common areas. Regular inspections will be conducted.
                </p>
              </div>
 
              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-transform duration-200">
                <h3 className="text-lg font-semibold text-blue-700 mb-2">Prohibitions</h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Pets, smoking, and illegal substances are strictly prohibited.
                  Violations may result in eviction.
                </p>
              </div>
            </div>
          </section>
 
       {/* Contract Section */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <FileText className="w-6 h-6 text-green-600" />
            Rental Contract
          </h2>

          <div className="bg-white rounded-xl shadow-md overflow-hidden divide-y divide-gray-200">
            {/* Start Date */}
            <div className="flex items-center gap-4 p-6 hover:bg-gray-50 transition">
              <CalendarDays className="w-5 h-5 text-green-500" />
              <div>
                <p className="font-medium text-gray-900">Contract Start Date</p>
                <p className="text-sm text-gray-600">
                  {loading
                    ? "Loading..."
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
                <p className="font-medium text-gray-900">Contract End Date</p>
                <p className="text-sm text-gray-600">
                  {loading
                    ? "Loading..."
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
                <p className="font-medium text-gray-900">Key Terms</p>
                <p className="text-sm text-gray-600">
                  Rent: 3000 Baht/month • Deposit: 3000 • Utilities: Included
                </p>
              </div>
            </div>
          </div>

            <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Contract PDF</h3>
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