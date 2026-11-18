"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import {
  ArrowRightIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  MailIcon,
  UserIcon,
} from "@/components/icons";
import { BrandMark } from "@/components/brand-mark";
import {
  createSession,
  nameFromEmail,
  readAccount,
  readSession,
  writeAccount,
  writeSession,
} from "@/lib/session";

type Mode = "login" | "signup";

type Errors = {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const signup = mode === "signup";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (readSession()) router.replace("/dashboard");
  }, [router]);

  function validate(): Errors {
    const next: Errors = {};
    if (signup && name.trim().length < 2) {
      next.name = "Enter your full name.";
    }
    if (!EMAIL_RE.test(email.trim())) {
      next.email = "Enter a valid email address.";
    }
    if (password.length < 6) {
      next.password = "Use at least 6 characters.";
    }
    if (signup && confirm !== password) {
      next.confirm = "Passwords do not match.";
    }
    return next;
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const normalisedEmail = email.trim().toLowerCase();
    const account = readAccount();
    const displayName =
      account && account.email === normalisedEmail
        ? account.name
        : name.trim() || nameFromEmail(normalisedEmail);

    if (signup) {
      writeAccount({ name: displayName, email: normalisedEmail });
    }

    writeSession(createSession(displayName, normalisedEmail));
    router.replace("/dashboard");
  }

  function signInAsDemo() {
    writeSession(createSession("Demo Researcher", "demo@iris.app"));
    router.replace("/dashboard");
  }

  return (
    <div className="auth-card">
      <Link href="/" className="auth-brand" aria-label="Iris Classifier home">
        <BrandMark height={42} priority />
      </Link>

      <h1>{signup ? "Create your account" : "Welcome back"}</h1>
      <p className="auth-sub">
        {signup
          ? "Set up a workspace to run predictions and keep your classification history."
          : "Sign in to classify specimens, review your history and inspect the model."}
      </p>

      <form className="auth-form" onSubmit={submit} noValidate>
        {signup ? (
          <label className="auth-field">
            <span>Full name</span>
            <span className="auth-input-wrap">
              <UserIcon size={16} className="auth-input-icon" />
              <input
                type="text"
                autoComplete="name"
                placeholder="Ama Mensah"
                value={name}
                onChange={(event) => setName(event.target.value)}
                aria-invalid={errors.name ? "true" : undefined}
                aria-describedby={errors.name ? "auth-name-error" : undefined}
              />
            </span>
            {errors.name ? (
              <span className="auth-error" id="auth-name-error">
                {errors.name}
              </span>
            ) : null}
          </label>
        ) : null}

        <label className="auth-field">
          <span>Email</span>
          <span className="auth-input-wrap">
            <MailIcon size={16} className="auth-input-icon" />
            <input
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={errors.email ? "true" : undefined}
              aria-describedby={errors.email ? "auth-email-error" : undefined}
            />
          </span>
          {errors.email ? (
            <span className="auth-error" id="auth-email-error">
              {errors.email}
            </span>
          ) : null}
        </label>

        <label className="auth-field">
          <span>Password</span>
          <span className="auth-input-wrap">
            <LockIcon size={16} className="auth-input-icon" />
            <input
              type={showPassword ? "text" : "password"}
              autoComplete={signup ? "new-password" : "current-password"}
              placeholder="At least 6 characters"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={errors.password ? "true" : undefined}
              aria-describedby={
                errors.password ? "auth-password-error" : undefined
              }
            />
            <button
              type="button"
              className="auth-eye"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
            </button>
          </span>
          {errors.password ? (
            <span className="auth-error" id="auth-password-error">
              {errors.password}
            </span>
          ) : null}
        </label>

        {signup ? (
          <label className="auth-field">
            <span>Confirm password</span>
            <span className="auth-input-wrap">
              <LockIcon size={16} className="auth-input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Repeat your password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                aria-invalid={errors.confirm ? "true" : undefined}
                aria-describedby={
                  errors.confirm ? "auth-confirm-error" : undefined
                }
              />
            </span>
            {errors.confirm ? (
              <span className="auth-error" id="auth-confirm-error">
                {errors.confirm}
              </span>
            ) : null}
          </label>
        ) : null}

        {!signup ? (
          <div className="auth-row">
            <label className="auth-check">
              <input type="checkbox" defaultChecked />
              <span>Remember me</span>
            </label>
            <button
              type="button"
              className="auth-link"
              onClick={() =>
                setNotice(
                  "Password recovery is disabled in this academic demo. Use the demo account or create a new one.",
                )
              }
            >
              Forgot password?
            </button>
          </div>
        ) : null}

        {notice ? (
          <p className="auth-notice" role="status">
            {notice}
          </p>
        ) : null}

        <button className="btn btn-primary btn-block auth-submit" type="submit">
          {signup ? "Create account" : "Sign in"}
          <ArrowRightIcon size={16} />
        </button>
      </form>

      <div className="auth-divider">
        <span>or</span>
      </div>

      {signup ? (
        <Link href="/login" className="btn btn-outline btn-block">
          Sign in instead
        </Link>
      ) : (
        <button
          type="button"
          className="btn btn-outline btn-block"
          onClick={signInAsDemo}
        >
          Use a demo account
        </button>
      )}

      <p className="auth-switch">
        {signup ? "Already have an account?" : "Don't have an account?"}{" "}
        <Link href={signup ? "/login" : "/signup"}>
          {signup ? "Sign in" : "Sign up"}
        </Link>
      </p>

      <p className="auth-demo-note">
        Demo authentication only. Accounts and prediction history stay in this
        browser.
      </p>
    </div>
  );
}
