import Image from "next/image";
import { BookOpen } from "lucide-react";

/** Use the course's real image. Missing images get an explicit empty slot. */
export function CourseCover({
  src,
  title,
}: {
  src?: string | null;
  title: string;
}) {
  const valid =
    src &&
    (/^https?:\/\//i.test(src) ||
      (src.startsWith("/") && !src.startsWith("//")));
  return (
    <div className={`course-cover ${valid ? "" : "course-cover-empty"}`}>
      {valid ? (
        <Image src={src} alt={title} width={600} height={360} unoptimized />
      ) : (
        <>
          <BookOpen size={34} strokeWidth={1.3} aria-hidden="true" />
        </>
      )}
    </div>
  );
}
