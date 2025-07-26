"use client";

export default function RulesContractPage() {
  return (
    <div className="bg-white">
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-10 bg-white min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Regulations & Rental Contract</h1>

      {/* Rules & Regulations */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Rules & Regulations</h2>
        <div className="space-y-4 divide-y divide-gray-200">
          <div className="pt-4 flex justify-between items-start gap-4">
            <p className="text-blue-700 font-medium min-w-[200px]">Opening/Closing Times</p>
            <p className="text-gray-700 flex-1">
              The dormitory is open 24/7, but quiet hours are from 10 PM to 8 AM. All residents must be out of the building by the end of the academic year.
            </p>
          </div>

          <div className="pt-4 flex justify-between items-start gap-4">
            <p className="text-blue-700 font-medium">Payment Policies</p>
            <p className="text-gray-700">
              Rent is due on the 1st of each month. Late fees apply after the 5th. Accepted payment methods include online transfers and checks.
            </p>
          </div>

          <div className="pt-4 flex justify-between items-start gap-4">
            <p className="text-blue-700 font-medium">Cleanliness Guidelines</p>
            <p className="text-gray-700">
              Residents are responsible for maintaining the cleanliness of their rooms and common areas. Regular inspections will be conducted.
            </p>
          </div>

          <div className="pt-4 flex justify-between items-start gap-4">
            <p className="text-blue-700 font-medium">Prohibitions</p>
            <p className="text-gray-700">
              Pets, smoking, and illegal substances are strictly prohibited. Violations may result in eviction.
            </p>
          </div>
        </div>
      </section>

      {/* Rental Contract */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Rental Contract</h2>
        <div className="space-y-4 divide-y divide-gray-200">
          <div className="pt-4 flex justify-between items-start gap-4">
            <p className="text-blue-700 font-medium">Tenant Information</p>
            <p className="text-gray-700">Name: Alex Turner, Room Number: 203, Building: North Hall</p>
          </div>

          <div className="pt-4 flex justify-between items-start gap-4">
            <p className="text-blue-700 font-medium">Contract Start Date</p>
            <p className="text-gray-700">August 20, 2024</p>
          </div>

          <div className="pt-4 flex justify-between items-start gap-4">
            <p className="text-blue-700 font-medium">Contract End Date</p>
            <p className="text-gray-700">May 15, 2025</p>
          </div>

          <div className="pt-4 flex justify-between items-start gap-4">
            <p className="text-blue-700 font-medium">Key Terms</p>
            <p className="text-gray-700">Rent: 3000 Baht/month, Security Deposit: 3000, Utilities: Included</p>
          </div>
        </div>
      </section>

    </div>
    </div>
  );
}