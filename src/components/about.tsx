'use client';
 
export default function AboutUsPage() {
  return (
      <div className="px-6 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-800  border-b pb-3 text-left mt-2">About Us</h2>
        {/* คำโปรย */}
        <p className="text-lg text-gray-700 leading-relaxed mb-1 mt-2 ">
          <span className="font-semibold text-blue-700 mr-2 ">Dorm</span>
          An online dormitory management system designed to provide both dormitory owners and tenants with a simple, fast, and secure experience.
        </p>
 
        {/* จุดเด่น */}
        <div className="grid md:grid-cols-3 gap-8 text-left">
          <div className="p-6 bg-white rounded-xl shadow hover:shadow-lg hover:scale-105 transition-transform duration-300 cursor-pointer">
            <i className="ri-building-2-line text-4xl text-blue-600 mb-4"></i>
            <h4 className="text-xl font-semibold mb-2 text-gray-800">
              Room Management
            </h4>
            <p className="text-gray-600">
              The dorm owner can easily add, delete, and edit room information.
            </p>
          </div>
 
          <div className="p-6 bg-white rounded-xl shadow hover:shadow-lg hover:scale-105 transition-transform duration-300 cursor-pointer">
            <i className="ri-tools-line text-4xl text-yellow-500 mb-4"></i>
            <h4 className="text-xl font-semibold mb-2 text-gray-800">
              Maintenance Requests
            </h4>
            <p className="text-gray-600">
              Tenants can report repairs and track their status anytime, anywhere.
            </p>
          </div>
 
          <div className="p-6 bg-white rounded-xl shadow hover:shadow-lg hover:scale-105 transition-transform duration-300 cursor-pointer">
            <i className="ri-bill-line text-4xl text-green-600 mb-4"></i>
            <h4 className="text-xl font-semibold mb-2 text-gray-800">
              Billing System
            </h4>
            <p className="text-gray-600">
              Easily view rent bills, attach payment slips, and check payment history.
            </p>
          </div>
        </div>
 
     
      </div>
    </div>
  );
}