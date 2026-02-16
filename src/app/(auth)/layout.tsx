import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const logoUrl = "/icons/logo_Toulouse_Rando512.jpg";
  
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center p-4">
       <div className="absolute top-6 left-6">
         <Link href="/" className="flex items-center gap-3 text-foreground">
            <Image src={logoUrl} alt="Toulouse rando Logo" width={50} height={50} className="rounded-md" />
            <span className="text-xl font-bold">Toulouse rando</span>
          </Link>
       </div>
      {children}
    </main>
  );
}
