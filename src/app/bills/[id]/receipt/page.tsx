import { ReceiptPDF } from "@/components/pdf/ReceiptPDF";
import { PDFViewer } from "@react-pdf/renderer";

async function getBill(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/bills/${id}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function ReceiptPage({ params }: { params: { id: string } }) {
  const bill = await getBill(params.id);

  if (!bill || bill.status !== "PAID") {
    return (
      <div className="p-4 text-center text-red-500">
        ไม่พบข้อมูลบิล หรือบิลยังไม่ได้ชำระเงิน
      </div>
    );
  }

  return (
    <div className="h-screen">
      <PDFViewer width="100%" height="100%">
        <ReceiptPDF bill={bill} />
      </PDFViewer>
    </div>
  );
}
