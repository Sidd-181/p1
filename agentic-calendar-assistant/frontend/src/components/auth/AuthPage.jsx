import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import LoginLeft from "./LoginLeft";

const fieldClass =
  "w-full border-0 border-b border-zinc-200 bg-transparent px-0 py-2.5 text-[15px] text-zinc-800 outline-none transition-colors placeholder:text-zinc-300 focus:border-zinc-900";

const labelClass =
  "mb-3 block text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-400";

const AuthPage = ({ mode }) => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const isLogin = mode === "login";

  async function handleSubmit(event) {
    event.preventDefault();
    if (loading) return;

    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await login({ email, password });
      } else {
        await register({ name, email, password });
      }
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-white font-sans text-zinc-900">
      <LoginLeft />
      <div className="flex flex-1 items-center justify-center px-8 py-16 sm:px-16">
        <div className="w-full max-w-[420px]">
          <div className="mb-10">
            <h1 className="text-[32px] font-medium tracking-tight text-zinc-900">
              {isLogin ? "Welcome back" : "Create an account"}
            </h1>
            <p className="mt-2 text-[15px] text-zinc-400">
              {isLogin
                ? "Enter your details to sign in to your account."
                : "Get started by entering your registration details."}
            </p>
          </div>

          {error ? (
            <div className="mb-8 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          ) : null}

          <form className="space-y-8" onSubmit={handleSubmit}>
            {!isLogin ? (
              <div>
                <label htmlFor="name" className={labelClass}>
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  className={fieldClass}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="john doe"
                  autoComplete="name"
                  required
                />
              </div>
            ) : null}

            <div>
              <label htmlFor="email" className={labelClass}>
                Email Address
              </label>
              <input
                type="email"
                id="email"
                className={fieldClass}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="demo@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className={labelClass}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  className={`${fieldClass} pr-8`}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder=" "
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  minLength={isLogin ? 1 : 6}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center text-zinc-300 hover:text-zinc-500"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center rounded-md bg-[linear-gradient(90deg,#ea580c_0%,#f97316_55%,#fb923c_100%)] text-[15px] font-medium text-white shadow-[0_8px_20px_rgba(234,88,12,0.28)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <LoaderCircle className="mr-2 size-4 animate-spin" />
              ) : null}
              {isLogin ? "Sign in" : "Sign up"}
            </button>
          </form>

          <p className="mt-10 text-[14px] text-zinc-400">
            {isLogin ? (
              <>
                New to Agentic Calendar?{" "}
                <Link to="/signup" className="text-zinc-600 hover:underline">
                  Create an account
                </Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link to="/login" className="text-zinc-600 hover:underline">
                  Sign in here
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
