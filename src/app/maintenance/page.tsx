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
        console.error('Failed to fetch repair history', err)
      }
    }

    fetchHistory()
  }, [])

    const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error("กรุณากรอกรายละเอียดปัญหา");
      return;
    }

    if (!category) {
      toast.error("Please Select Category");
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

    toast.success("ส่งคำร้องสำเร็จ ✅");
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

    <main className="flex-1 max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-[#0F3659] mb-1">Maintenance & Repair</h1>
      <p className="text-gray-600 mb-6">Submit and track your maintenance requests easily.</p>

      <div className="bg-white p-6 rounded-xl shadow-sm mb-10 border border-gray-200">
        <h2 className="text-lg font-semibold text-[#0F3659] mb-4">Submit a New Request</h2>

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the issue..."
          rows={4}
          className="w-full border border-gray-300 p-3 rounded-md bg-white text-black focus:ring-2 focus:ring-[#0F3659] outline-none mb-4"
        />

        <label className="block font-medium text-gray-700 mb-2">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full border border-gray-300 p-3 rounded-md text-black bg-white focus:ring-2 focus:ring-[#0F3659] outline-none mb-6"
          required
        >
          <option value="" disabled>-- Please select a category --</option>
          <option value="ELECTRICITY">Electricity</option>
          <option value="PLUMBING">Plumbing</option>
          <option value="INTERNET">Internet</option>
          <option value="AIR_CONDITIONER">Air Conditioner</option>
          <option value="FURNITURE">Furniture</option>
          <option value="OTHER">Other</option>
        </select>

        <div className="border-2 border-dashed rounded-lg p-6 text-center bg-gray-50 text-gray-500 flex flex-col items-center justify-center">
          {previewUrls.length > 0 ? (
            <div className="flex flex-wrap gap-4 mt-2">
              {previewUrls.map((url, idx) => (
                <div key={idx} className="w-24 h-24 relative border rounded-md overflow-hidden">
                  <Image src={url} alt={`Preview ${idx + 1}`} layout="fill" objectFit="cover" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <p className="font-semibold mb-1">Upload images</p>
              <p className="text-sm mb-4">Drag and drop, or click browse</p>
              <label
                htmlFor="image-upload"
                className="cursor-pointer bg-[#0F3659] hover:bg-[#15476f] text-white font-medium px-4 py-2 rounded"
              >
                Browse
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
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-[#0F3659] mb-4">Your Requests</h2>
        <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-600 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 border-b border-gray-200">Request ID</th>
                <th className="px-4 py-3 border-b border-gray-200">Category</th>
                <th className="px-4 py-3 border-b border-gray-200">Status</th>
                <th className="px-4 py-3 border-b border-gray-200">Submitted</th>
                <th className="px-4 py-3 border-b border-gray-200">Updated</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3">#{r.id.slice(0, 8)}</td>
                  <td className="px-4 py-3">{r.category}</td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      r.status === 'PENDING'
                        ? 'bg-gray-400 text-white'
                        : r.status === 'IN_PROGRESS'
                        ? 'bg-yellow-500 text-white'
                        : r.status === 'COMPLETED'
                        ? 'bg-green-600 text-white'
                        : 'bg-red-600 text-white'
                    }`}>
                      {r.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">{dayjs(r.createdAt).format('DD MMM YYYY')}</td>
                  <td className="px-4 py-3">{dayjs(r.updatedAt).format('DD MMM YYYY')}</td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-gray-500">
                    No requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  </div>
);}