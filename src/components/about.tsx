'use client';

export default function AboutUsPage() {
  return (
    <div className="px-6 py-12">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-2xl font-bold text-gray-800 border-b pb-3 text-left mt-2">About Us</h2>
        
        {/* คำโปรย */}
        <p className="text-lg text-gray-700 leading-relaxed mb-6 mt-4 text-left">
          <span className="font-semibold text-blue-700 mr-2">Dorm</span>
          was created with the vision of transforming traditional dormitory management into a seamless digital experience. 
          We aim to simplify life for both dormitory owners and tenants by offering a modern, secure, and user-friendly system.
        </p>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-8 text-left mt-8">
          <div className="p-6 bg-white rounded-xl shadow hover:shadow-lg transition-transform duration-300">
            <h4 className="text-xl font-semibold mb-3 text-gray-800">Our Mission</h4>
            <p className="text-gray-600">
              To make dormitory management effortless and transparent, reducing manual work for owners 
              while giving tenants more convenience and confidence.
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl shadow hover:shadow-lg transition-transform duration-300">
            <h4 className="text-xl font-semibold mb-3 text-gray-800">Our Vision</h4>
            <p className="text-gray-600">
              A future where every dormitory, big or small, can be managed efficiently through technology, 
              fostering better relationships between owners and tenants.
            </p>
          </div>
        </div>  
      </div>
    </div>
  );
}
