import Image from "next/image";
import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2">
      <Image src="/logo.png" alt="" width={24} height={28} priority />
      <span className="text-[15px] font-semibold tracking-tight">DealGuard MY</span>
    </Link>
  );
}
