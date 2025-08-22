'use client'
 
export default function ContactPage() {
  return (
    <div className="space-y-6 text-center px-4 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800  border-b pb-3 text-left mt-2">Contact</h2>
      <p className="text-sm text-gray-700 leading-relaxed">
        If you have any questions or suggestions, feel free to reach out to us through the following channels.
      </p>
 
      <div className="flex justify-center gap-6 text-sm text-gray-800">
        <a
          href="tel:0987654321"
          className="flex items-center space-x-2 border border-gray-300 rounded-lg px-4 py-2 min-w-[180px] max-w-sm transition-transform duration-200 hover:scale-105 hover:border-blue-600 cursor-pointer"
        >
          <i className="ri-phone-line text-blue-600 text-lg"></i>
          <span>093-640-3500</span>
        </a>
 
        <a
          href="mailto:dormitory@example.com"
          className="flex items-center space-x-2 border border-gray-300 rounded-lg px-4 py-2 min-w-[220px] max-w-sm transition-transform duration-200 hover:scale-105 hover:border-blue-600 cursor-pointer"
        >
          <i className="ri-mail-line text-blue-600 text-lg"></i>
          <span>dormitory@example.com</span>
        </a>
      </div>
 
      {/* ที่อยู่ ไม่มีกรอบ */}
      <div className="flex items-center space-x-2 mt-4 max-w-xl mx-auto text-gray-800 text-sm justify-center">
        <i className="ri-map-pin-line text-blue-600 text-lg"></i>
        <span>University of Phayao, Mae Ka Subdistrict, Mueang District, Phayao Province 56000</span>
      </div>
 
      <div className="mt-6">
        <iframe
          title="University of Phayao Location"
          src="https://maps.google.com/maps?q=University%20of%20Phayao&t=&z=15&ie=UTF8&iwloc=&output=embed"
          width="100%"
          height="300"
          allowFullScreen
          loading="lazy"
          className="rounded-lg border"
        />
      </div>
    </div>
  )
}