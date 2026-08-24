import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^\d{10}$/, "Phone must be exactly 10 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const searchTrainSchema = z.object({
  source: z.string().min(1, "Select source station"),
  destination: z.string().min(1, "Select destination station"),
  date: z.string().min(1, "Select journey date"),
});

export const passengerSchema = z.object({
  passengerName: z.string().min(2, "Name must be at least 2 characters"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"], { message: "Select gender" }),
  age: z.number().min(1, "Age must be at least 1").max(120, "Invalid age"),
  aadharNumber: z.string().regex(/^\d{12}$/, "Aadhar must be exactly 12 digits"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  phone: z.string().regex(/^\d{10}$/, "Phone must be exactly 10 digits"),
});

export const cancellationSchema = z.object({
  pnr: z.string().regex(/^\d{10}$/, "PNR must be exactly 10 digits"),
  reason: z.string().min(1, "Select a reason"),
});

export const pnrEnquirySchema = z.object({
  pnr: z.string().regex(/^\d{10}$/, "PNR must be exactly 10 digits"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type SearchTrainInput = z.infer<typeof searchTrainSchema>;
export type PassengerInput = z.infer<typeof passengerSchema>;
export type CancellationInput = z.infer<typeof cancellationSchema>;
export type PnrEnquiryInput = z.infer<typeof pnrEnquirySchema>;
