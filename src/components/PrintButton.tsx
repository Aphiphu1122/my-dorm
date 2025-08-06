// components/PrintButton.tsx
"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
    >
      🖨️ พิมพ์ใบเสร็จ
    </button>
  );
}
