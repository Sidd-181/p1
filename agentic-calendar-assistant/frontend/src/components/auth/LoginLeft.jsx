function LoginLeft() {
  return (
    <div className="relative hidden min-h-screen w-[42%] flex-col justify-between overflow-hidden bg-[linear-gradient(180deg,#2b0510_0%,#7a1024_38%,#c2410c_72%,#fb923c_100%)] px-12 pb-10 pt-12 text-white lg:flex">
      <div className="flex items-center gap-3">
        <svg
          viewBox="0 0 32 32"
          className="size-8"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M16 3.2 28.4 10v12L16 28.8 3.6 22V10L16 3.2Z"
            stroke="white"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-[28px] font-medium tracking-tight">
          Agentic Calendar
        </span>
      </div>

      <div className="max-w-[420px] pb-16">
        <h2 className="text-[34px] font-medium leading-tight tracking-tight">
          Build your presence on web
        </h2>
        <p className="mt-4 max-w-[380px] text-[15px] leading-7 text-white/80">
          Describe what you need, preview instantly, and customize your site in
          real-time. React with clean JSX, verified layouts, and instant code
          exports.
        </p>
      </div>

      <p className="text-sm text-white/70">Copyright 2026 Agentic Calendar</p>
    </div>
  );
}

export default LoginLeft;
