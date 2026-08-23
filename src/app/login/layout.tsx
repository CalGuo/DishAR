import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-zinc-900 px-4">
      <Link href="/" className="mb-8 text-lg font-semibold text-white">
        Login
      </Link>
      {children}
    </div>
  );
}
