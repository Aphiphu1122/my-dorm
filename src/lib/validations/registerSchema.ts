import { z } from "zod";

export const RegisterSchema = z
  .object({
    firstName: z.string().min(1, "กรุณากรอกชื่อ"),
    lastName: z.string().min(1, "กรุณากรอกนามสกุล"),
    email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง"),
    phone: z.string().min(10, "กรุณากรอกเบอร์โทรให้ครบ"),
    birthday: z.string().min(1, "กรุณาเลือกวันเกิด"),
    address: z.string().min(1, "กรุณากรอกที่อยู่"),
    nationalId: z
      .string()
      .length(13, "รหัสบัตรประชาชนต้องมี 13 หลัก")
      .regex(/^\d+$/, "ต้องเป็นตัวเลขเท่านั้น"),
    password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
    confirmPassword: z.string().min(6, "กรุณายืนยันรหัสผ่าน"),
    userId: z.string().uuid("User ID ต้องเป็น UUID"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "รหัสผ่านไม่ตรงกัน",
    path: ["confirmPassword"],
  });
