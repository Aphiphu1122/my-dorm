'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import dayjs from 'dayjs'
import Image from 'next/image'
import Sidebar from "@/components/sidebar";
import toast from "react-hot-toast";

interface MaintenanceRequest {
  id: string
  status: string
  createdAt: string
  updatedAt: string
  category: string
}

export default function MaintenancePage() {
  const [description, setDescription] = useState('')
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [category, setCategory] = useState('')
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (images.length === 0) {
      setPreviewUrls([]);
      return;
    }

    const urls = images.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [images]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/maintenance/roomhistory')
        const data = await res.json()
        setRequests(data.requests || [])
      } catch (err) {
        console.error('ไม่สามารถโหลดประวัติการแจ้งซ่อมได้', err)
      }
    }

    fetchHistory()
  }, [])

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error("กรุณากรอกรายละเอียดของปัญหา");
      return;
    }

    if (!category) {
      toast.error("กรุณาเลือกหมวดหมู่");
      return;
    }

    setLoading(true);

    const formData = new FormData()
    formData.append("description", description);
    formData.append("category", category);
    images.forEach((img) => formData.append("images", img));

    try {
      await axios.post("/api/maintenance", formData);
      setDescription("");
      setCategory("");
      setImages([]);
      setPreviewUrls([]);

      toast.success("ส่งคำร้องแจ้งซ่อมสำเร็จ ✅");
      location.reload();
    } catch (err) {
      console.error(err);
      toast.error("ไม่สามารถส่งคำร้องได้ ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      <aside className="w-64 border-r border-gray-200 sticky top-0 h-screen">
        <Sidebar role="user" />
      </aside>

      <main className="flex-1 p-8 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-[#0F3659] mb-1">ระบบแจ้งซ่อมและบำรุงรักษา</h1>
        <p className="text-gray-600 mb-6">ส่งคำร้องและติดตามสถานะการแจ้งซ่อมได้ที่นี่</p>

        <div className="bg-white p-6 rounded-xl shadow-sm mb-10 border border-gray-200">
          <h2 className="text-lg font-semibold text-[#0F3659] mb-4">ส่งคำร้องแจ้งซ่อมใหม่</h2>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="โปรดระบุรายละเอียดของปัญหา..."
            rows={4}
            className="w-full border border-gray-300 p-3 rounded-md bg-white text-black focus:ring-2 focus:ring-blue-500 outline-none mb-4"
          />

          <label className="block font-medium text-gray-700 mb-2">หมวดหมู่</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border border-gray-300 p-3 rounded-md text-black bg-white focus:ring-2 focus:ring-blue-500 outline-none mb-6"
            required
          >
            <option value="" disabled>-- กรุณาเลือกหมวดหมู่ --</option>
            <option value="ELECTRICITY">ระบบไฟฟ้า</option>
            <option value="PLUMBING">ระบบประปา</option>
            <option value="INTERNET">อินเทอร์เน็ต</option>
            <option value="AIR_CONDITIONER">เครื่องปรับอากาศ</option>
            <option value="FURNITURE">เฟอร์นิเจอร์</option>
            <option value="OTHER">อื่น ๆ</option>
          </select>

          <div className="border-2 border-dashed rounded-lg p-6 text-center bg-gray-50 text-gray-500 flex flex-col items-center justify-center">
            {previewUrls.length > 0 ? (
              <div className="flex flex-wrap gap-4 mt-2">
                {previewUrls.map((url, idx) => (
                  <div key={idx} className="w-24 h-24 relative border rounded-md overflow-hidden">
                    <Image src={url} alt={`ภาพตัวอย่าง ${idx + 1}`} layout="fill" objectFit="cover" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <p className="font-semibold mb-1">อัปโหลดรูปภาพ</p>
                <p className="text-sm mb-4">ลากและวางไฟล์ หรือคลิกปุ่มเลือกไฟล์</p>
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer bg-[#0F3659] hover:bg-[#15476f] text-white font-medium px-4 py-2 rounded"
                >
                  เลือกไฟล์
                </label>
              </>
            )}

            <input
              id="image-upload"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                setImages(files);
              }}
              className="hidden"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-[#0F3659] text-white px-6 py-2 mt-3 rounded-md shadow-md transition hover:scale-105 hover:bg-[#15476f] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'กำลังส่ง...' : 'ส่งคำร้องแจ้งซ่อม'}
            </button>
          </div>
        </div>

        {/* Requests History */}
        <h2 className="text-xl font-semibold text-[#0F3659] mb-4 flex items-center gap-2">
          <i className="ri-history-line text-2xl text-blue-600"></i> ประวัติการแจ้งซ่อมของคุณ
        </h2>
        <div className="grid md:grid-cols-2 gap-6 ">
          {requests.length > 0 ? requests.map((r) => (
            <div key={r.id} className="bg-white cursor-pointer hover:scale-105 transition-transform duration-200 rounded-2xl shadow-md p-4 border border-gray-100 hover:shadow-lg ">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-gray-800">#{r.id.slice(0, 8)}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  r.status === 'PENDING' ? 'bg-gray-400 text-white' :
                  r.status === 'IN_PROGRESS' ? 'bg-yellow-500 text-white' :
                  r.status === 'COMPLETED' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                }`}>
                  {r.status === 'PENDING' && 'รอดำเนินการ'}
                  {r.status === 'IN_PROGRESS' && 'กำลังดำเนินการ'}
                  {r.status === 'COMPLETED' && 'เสร็จสิ้น'}
                  {r.status !== 'PENDING' && r.status !== 'IN_PROGRESS' && r.status !== 'COMPLETED' && 'ยกเลิก'}
                </span>
              </div>
              <p className="text-gray-600 mb-1"><strong>หมวดหมู่:</strong> {r.category}</p>
              <p className="text-gray-500 text-sm">วันที่ส่ง: {dayjs(r.createdAt).format('DD/MM/YYYY')}</p>
              <p className="text-gray-500 text-sm">อัปเดตล่าสุด: {dayjs(r.updatedAt).format('DD/MM/YYYY')}</p>
            </div>
          )) : (
            <p className="text-gray-500 col-span-2 text-center py-6">ยังไม่มีคำร้องแจ้งซ่อม</p>
          )}
        </div>
      </main>
    </div>
  );
}
