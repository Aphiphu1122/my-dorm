export default function ForbiddenPage() {
  return (
    <div className="p-8 text-center text-red-500">
      <h1 className="text-2xl font-bold">⛔ ไม่มีสิทธิ์เข้าถึง</h1>
      <p>คุณต้องเป็นผู้ดูแลระบบ (Admin) เท่านั้นจึงจะเข้าถึงหน้านี้ได้</p>
    </div>
  );
}
