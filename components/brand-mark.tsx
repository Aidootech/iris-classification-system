import Image from "next/image";

/**
 * The supplied Iris Classifier logo.  Rendered as an image so the same artwork
 * is used in the header, footer, dashboard, auth screen and browser tab.
 */
export function BrandMark({
  size = 32,
  className,
}: Readonly<{ size?: number; className?: string }>) {
  return (
    <Image
      src="/iris-logo.png"
      alt=""
      width={size}
      height={size}
      className={className ? `brand-mark ${className}` : "brand-mark"}
      aria-hidden="true"
    />
  );
}
