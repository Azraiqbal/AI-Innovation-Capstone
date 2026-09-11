import { useState } from "react";
import { ShieldAlert, Mail, Lock, UserPlus, LogIn } from "lucide-react";
import { supabase } from "./supabase";

function Auth() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        setMessage(
          "Account created. Please check your email to confirm your account."
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
      }
    } catch (err) {
      setError(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07111f] text-white flex items-center justify-center p-5">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-4">
            <ShieldAlert className="text-cyan-400" size={30} />
          </div>

          <p className="text-cyan-400 text-sm font-medium">
            AI INNOVATION CAPSTONE
          </p>

          <h1 className="text-3xl font-bold mt-2">
            Crisis Intelligence
          </h1>

          <p className="text-slate-400 mt-2">
            Secure access to the Crisis Command Center
          </p>
        </div>

        <div className="border border-slate-800 bg-[#0b1729] rounded-2xl p-6">

          <div className="grid grid-cols-2 bg-[#07111f] rounded-xl p-1 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
                setMessage("");
              }}
              className={`py-2.5 rounded-lg text-sm font-medium ${
                mode === "login"
                  ? "bg-cyan-500 text-slate-950"
                  : "text-slate-400"
              }`}
            >
              Login
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setError("");
                setMessage("");
              }}
              className={`py-2.5 rounded-lg text-sm font-medium ${
                mode === "signup"
                  ? "bg-cyan-500 text-slate-950"
                  : "text-slate-400"
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="text-sm text-slate-300">
                Email Address
              </label>

              <div className="relative mt-2">
                <Mail
                  size={18}
                  className="absolute left-3 top-3.5 text-slate-500"
                />

                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="responder@example.com"
                  className="w-full bg-[#07111f] border border-slate-700 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-300">
                Password
              </label>

              <div className="relative mt-2">
                <Lock
                  size={18}
                  className="absolute left-3 top-3.5 text-slate-500"
                />

                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full bg-[#07111f] border border-slate-700 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {error && (
              <div className="border border-red-500/30 bg-red-500/10 text-red-300 rounded-xl p-3 text-sm">
                {error}
              </div>
            )}

            {message && (
              <div className="border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 rounded-xl p-3 text-sm">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
            >
              {mode === "login" ? (
                <LogIn size={18} />
              ) : (
                <UserPlus size={18} />
              )}

              {loading
                ? "Please wait..."
                : mode === "login"
                ? "Login to Command Center"
                : "Create Account"}
            </button>

          </form>
        </div>

        <p className="text-center text-xs text-slate-600 mt-5">
          AI-powered disaster response decision support
        </p>

      </div>
    </div>
  );
}

export default Auth;