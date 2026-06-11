import { redirect } from "next/navigation";
import connectDB from "@/lib/mongodb"; 

export default async function Home() {
  // 1. Pehle database connect karein
  await connectDB();
  
  // 2. Database connect hone ke baad login par bhej dein
  redirect("/login");
}