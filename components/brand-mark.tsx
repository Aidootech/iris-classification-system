import Image from "next/image";

/** Aspect ratio of the supplied lockup (963 x 535). */
const RATIO = 963 / 535;

/**
 * The supplied Iris Classifier logo, rendered as an image so the same artwork
 * appears in the header, footer, dashboard, auth screen and browser tab.
 *
 * `tone="light"` swaps the dark "iris" wordmark for white so the lockup stays
 * legible on the dark botanical header and footer.
 */
export function BrandMark({
  height = 32,
  tone = "default",
  priority = false,
  className,
}: Readonly<{
  height?: number;
  tone?: "default" | "light";
  priority?: boolean;
  className?: string;
}>) {
  const width = Math.round(height * RATIO);

  return (
    <Image
      src={
        tone === "light" ? "/iris-lockup-light.png" : "/iris-lockup.png"
      }
      alt=""
      width={width}
      height={height}
      priority={priority}
      className={className ? `brand-mark ${className}` : "brand-mark"}
      aria-hidden="true"
    />
  );
}
