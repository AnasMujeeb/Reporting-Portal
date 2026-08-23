import { redirect } from "next/navigation";
import connectDB from "@/lib/mongodb"; 

export default async function Home() {
  
  await connectDB();
  
  
  redirect("/login");
}