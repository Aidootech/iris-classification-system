import type { Metadata } from "next";

import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to the Iris Classifier workspace to run predictions and keep a classification history.",
};

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
