'use client';

export default function AboutUsPage() {
  return (
    <div className="px-6 py-12 ">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-2xl font-bold text-gray-800 border-b pb-3 text-left">
          เกี่ยวกับเรา
        </h2>

        {/* คำโปรย */}
        <p className="text-lg text-gray-700 leading-relaxed mb-6 mt-4 text-left">
          <span className="font-semibold text-blue-700 mr-2">Dorm</span>
          จัดตั้งขึ้นด้วยวิสัยทัศน์ในการยกระดับการบริหารจัดการหอพักแบบดั้งเดิมให้เข้าสู่ระบบดิจิทัลที่มีประสิทธิภาพ 
          โดยมุ่งหวังที่จะอำนวยความสะดวกให้แก่ทั้งผู้ประกอบการและผู้พักอาศัย 
          ผ่านระบบที่ทันสมัย ปลอดภัย และใช้งานได้ง่าย
        </p>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-8 text-left mt-8">
          <div className="p-6 bg-white rounded-xl shadow hover:shadow-lg transition-transform duration-300">
            <h4 className="text-xl font-semibold mb-3 text-gray-800 flex items-center">
              <i className="ri-shield-check-line text-green-600 mr-2"></i>
              พันธกิจของเรา
            </h4>
            <p className="text-gray-600">
              มุ่งพัฒนาการบริหารจัดการหอพักให้มีความโปร่งใส รวดเร็ว และมีประสิทธิภาพ 
              ลดภาระงานด้านเอกสารของผู้ประกอบการ 
              พร้อมเพิ่มความสะดวกและสร้างความมั่นใจให้แก่ผู้พักอาศัย
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl shadow hover:shadow-lg transition-transform duration-300">
            <h4 className="text-xl font-semibold mb-3 text-gray-800 flex items-center">
              <i className="ri-shield-check-line text-green-600 mr-2"></i>
              วิสัยทัศน์ของเรา
            </h4>
            <p className="text-gray-600">
              มุ่งสู่อนาคตที่ทุกหอพัก ไม่ว่าจะมีขนาดเล็กหรือใหญ่ 
              สามารถบริหารจัดการได้อย่างมีประสิทธิภาพผ่านเทคโนโลยี 
              พร้อมส่งเสริมความสัมพันธ์ที่ดียิ่งขึ้นระหว่างผู้ประกอบการและผู้พักอาศัย
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
