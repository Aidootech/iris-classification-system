import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="auth-page">
      <Image
        className="auth-bg"
        src="/landing-bg.jpg"
        alt=""
        fill
        priority
        unoptimized
        sizes="100vw"
      />
      <div className="auth-shade" aria-hidden="true" />

      <div className="auth-main">
        <div className="auth-stage">{children}</div>
        <Link href="/" className="auth-back">
          <span aria-hidden="true">←</span> Back to home
        </Link>
      </div>
    </div>
  );
}
