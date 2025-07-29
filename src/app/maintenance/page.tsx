'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import dayjs from 'dayjs'
import Image from 'next/image'

interface MaintenanceRequest {
  id: string
  status: string
  createdAt: string
  updatedAt: string
  category: string
}

export default function MaintenancePage() {
  const [description, setDescription] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [category, setCategory] = useState('')
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [loading, setLoading] = useState(false)

  // ✅ Preview URL และ cleanup memory
  useEffect(() => {
    if (!image) {
      setPreviewUrl(null)
      return
    }

    const url = URL.createObjectURL(image)
    setPreviewUrl(url)

    return () => URL.revokeObjectURL(url)
  }, [image])

  // ✅ โหลดประวัติคำร้อง
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
      alert('Please enter a description')
      return
    }

    setLoading(true)

    const formData = new FormData()
    formData.append('description', description)
    formData.append('category', category)
    if (image) formData.append('image', image)

    try {
      await axios.post('/api/maintenance', formData)
      setDescription('')
      setCategory('ELECTRICITY')
      setImage(null)
      location.reload()
    } catch (err) {
      console.error(err)
      alert('Failed to submit')
    } finally {
      setLoading(false)
    }
  }

return (
  <div className="max-w-4xl mx-auto p-6 bg-white text-black">
    <h1 className="text-2xl font-bold mb-4">Repair Requests</h1>
    <p className="text-gray-600 mb-6">Submit and track your repair requests</p>

    {/* --- Submit Form --- */}
    <div className="mb-8">
      <h2 className="font-semibold mb-2">Submit a New Request</h2>

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe the issue..."
        rows={4}
        className="w-full border p-2 rounded mb-4 bg-white text-black"
      />

      <label className="block font-medium mb-1">Category</label>
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-full border p-2 rounded mb-4 text-black bg-white"
      >
        <option value="" disabled>
          -- โปรดเลือกหัวข้อปัญหา --
        </option>
        <option value="ELECTRICITY">Electricity</option>
        <option value="PLUMBING">Plumbing</option>
        <option value="INTERNET">Internet</option>
        <option value="AIR_CONDITIONER">Air Conditioner</option>
        <option value="FURNITURE">Furniture</option>
        <option value="OTHER">Other</option>
      </select>

      <div className="mb-4">
        <label className="block font-medium mb-1">Upload Images</label>
        <div className="border-2 border-dashed rounded-md p-6 text-center text-gray-600 bg-white">
          <p className="font-semibold text-gray-800 mb-1">Upload Images</p>
          <p className="text-sm mb-4">Drag and drop images here, or browse</p>
          <div>
            <label
              htmlFor="image-upload"
              className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium px-4 py-1 rounded shadow-sm inline-block"
            >
              Browse
            </label>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null
                setImage(file)
                setPreviewUrl(file ? URL.createObjectURL(file) : null)
              }}
              className="hidden"
            />
          </div>
        </div>

        {image && previewUrl && (
          <div className="mt-4">
            <p className="text-sm text-gray-600">Selected: {image.name}</p>
            <div className="relative w-40 h-40 mt-2">
              <Image
                src={previewUrl}
                alt="Preview"
                layout="fill"
                objectFit="contain"
                className="rounded border"
              />
            </div>
          </div>
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className={`bg-blue-900 text-white px-4 py-2 rounded ${
          loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-800'
        }`}
      >
        {loading ? 'Submitting...' : 'Submit Request'}
      </button>
    </div>

    {/* --- Request List --- */}
    <div>
      <h2 className="font-semibold mb-3">Your Requests</h2>
      <table className="w-full border text-sm bg-white text-black">
        <thead className="bg-gray-900 text-white">
          <tr>
            <th className="p-2 border">Request ID</th>
            <th className="p-2 border">Category</th>
            <th className="p-2 border">Status</th>
            <th className="p-2 border">Submitted On</th>
            <th className="p-2 border">Last Updated</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => (
            <tr key={r.id}>
              <td className="p-2 border">#{r.id.slice(0, 8)}</td>
              <td className="p-2 border">{r.category}</td>
              <td className="p-2 border">
                <span
                  className={`px-2 py-1 rounded text-white text-xs ${
                    r.status === 'PENDING'
                      ? 'bg-gray-500'
                      : r.status === 'IN_PROGRESS'
                      ? 'bg-yellow-500'
                      : r.status === 'COMPLETED'
                      ? 'bg-green-600'
                      : 'bg-red-600'
                  }`}
                >
                  {r.status.replace('_', ' ')}
                </span>
              </td>
              <td className="p-2 border">{dayjs(r.createdAt).format('DD MMM YYYY')}</td>
              <td className="p-2 border">{dayjs(r.updatedAt).format('DD MMM YYYY')}</td>
            </tr>
          ))}
          {requests.length === 0 && (
            <tr>
              <td colSpan={5} className="text-center p-4 text-gray-500">
                No requests found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
  )
}