import type { Metadata } from "next";

import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Create account",
  description:
    "Create an Iris Classifier workspace to run predictions and keep a classification history.",
};

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}
