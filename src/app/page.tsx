import { redirect } from "next/navigation";
import { paths } from "@/route/paths";

export default function Home() {
  redirect(paths.explore);
}
