import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 18, children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function IrisMark({
  size = 22,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <ellipse cx="12" cy="6.6" rx="3" ry="4.7" />
      <ellipse cx="12" cy="17.4" rx="3" ry="4.7" />
      <ellipse cx="6.6" cy="12" rx="4.7" ry="3" />
      <ellipse cx="17.4" cy="12" rx="4.7" ry="3" />
      <circle cx="12" cy="12" r="1.6" fill="var(--mark-center, #d7e9b8)" />
    </svg>
  );
}

export function OverviewIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.6" />
    </Icon>
  );
}

export function PredictIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.2l1.9 5.1 5.1 1.9-5.1 1.9L12 17.2l-1.9-5.1L5 10.2l5.1-1.9L12 3.2z" />
      <path d="M18.6 15.4l.8 2.1 2.1.8-2.1.8-.8 2.1-.8-2.1-2.1-.8 2.1-.8.8-2.1z" />
    </Icon>
  );
}

export function ModelsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 19.5V10" />
      <path d="M10 19.5V4.5" />
      <path d="M16 19.5v-7" />
      <path d="M22 19.5H2" />
    </Icon>
  );
}

export function DatasetIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <ellipse cx="12" cy="5.6" rx="7.5" ry="3" />
      <path d="M4.5 5.6v6c0 1.6 3.4 3 7.5 3s7.5-1.4 7.5-3v-6" />
      <path d="M4.5 11.6v6c0 1.6 3.4 3 7.5 3s7.5-1.4 7.5-3v-6" />
    </Icon>
  );
}

export function HistoryIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.6 12a8.4 8.4 0 1 0 2.6-6.1" />
      <path d="M3.6 4.6v4.2h4.2" />
      <path d="M12 7.6V12l3 1.8" />
    </Icon>
  );
}

export function ProfileIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="8.2" r="3.7" />
      <path d="M4.8 20.2c0-3.5 3.2-5.8 7.2-5.8s7.2 2.3 7.2 5.8" />
    </Icon>
  );
}

export function LogoutIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M14.5 8V5.8c0-.9-.7-1.6-1.6-1.6H5.8c-.9 0-1.6.7-1.6 1.6v12.4c0 .9.7 1.6 1.6 1.6h7.1c.9 0 1.6-.7 1.6-1.6V16" />
      <path d="M9.5 12h11" />
      <path d="M17.4 8.8L20.5 12l-3.1 3.2" />
    </Icon>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.5 7h17" />
      <path d="M3.5 12h17" />
      <path d="M3.5 17h17" />
    </Icon>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5.5 5.5l13 13" />
      <path d="M18.5 5.5l-13 13" />
    </Icon>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 12h15" />
      <path d="M14 6.5l5.5 5.5-5.5 5.5" />
    </Icon>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M19.5 12h-15" />
      <path d="M10 6.5L4.5 12l5.5 5.5" />
    </Icon>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="10.8" cy="10.8" r="6.6" />
      <path d="M15.7 15.7l4.3 4.3" />
    </Icon>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </Icon>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 9.5L12 15l6-5.5" />
    </Icon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 12.5l4.8 4.8L19.5 7" />
    </Icon>
  );
}

export function EyeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M2.6 12S6 5.8 12 5.8 21.4 12 21.4 12 18 18.2 12 18.2 2.6 12 2.6 12z" />
      <circle cx="12" cy="12" r="3" />
    </Icon>
  );
}

export function EyeOffIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9.9 6.1A9.8 9.8 0 0 1 12 5.8c6 0 9.4 6.2 9.4 6.2a17 17 0 0 1-3.2 3.9" />
      <path d="M6.2 7.4A17.4 17.4 0 0 0 2.6 12s3.4 6.2 9.4 6.2a9.6 9.6 0 0 0 3.5-.7" />
      <path d="M9.9 9.8a3 3 0 0 0 4.3 4.4" />
      <path d="M3.5 3.5l17 17" />
    </Icon>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="5.2" width="18" height="13.6" rx="2.2" />
      <path d="M3.8 6.4L12 12.4l8.2-6" />
    </Icon>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4.5" y="10.2" width="15" height="10.3" rx="2.2" />
      <path d="M8 10.2V7.8a4 4 0 0 1 8 0v2.4" />
    </Icon>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.9 20c0-3.4 3.1-5.6 7.1-5.6s7.1 2.2 7.1 5.6" />
    </Icon>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.5v11" />
      <path d="M7.8 10.6L12 14.8l4.2-4.2" />
      <path d="M4.5 17.5v2.2c0 .6.5 1 1 1h13c.6 0 1-.4 1-1v-2.2" />
    </Icon>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 6.5h16" />
      <path d="M9.5 6.5V4.8c0-.7.6-1.3 1.3-1.3h2.4c.7 0 1.3.6 1.3 1.3v1.7" />
      <path d="M6.3 6.5l.8 12.6c0 .8.7 1.4 1.5 1.4h6.8c.8 0 1.5-.6 1.5-1.4l.8-12.6" />
      <path d="M10 10.5v6" />
      <path d="M14 10.5v6" />
    </Icon>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3l7 2.6v5.6c0 4.6-3 7.6-7 9.3-4-1.7-7-4.7-7-9.3V5.6L12 3z" />
      <path d="M8.9 12l2.1 2.1 4.1-4.3" />
    </Icon>
  );
}

export function TargetIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.8" />
      <circle cx="12" cy="12" r="1.2" />
    </Icon>
  );
}

export function ActivityIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 12.5h4.2L10 5.5l4 13 2.5-6h4.5" />
    </Icon>
  );
}

export function LayersIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.2l8.5 4.4-8.5 4.4-8.5-4.4L12 3.2z" />
      <path d="M3.5 12.2L12 16.6l8.5-4.4" />
      <path d="M3.5 16.4L12 20.8l8.5-4.4" />
    </Icon>
  );
}
