import React, { useState } from "react";
import { useNavigate } from "react-router";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  username: z.string().min(3, "Username must be at least 3 characters").optional(),
});

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: "", password: "", username: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const validation = authSchema.safeParse(formData);
      if (!validation.success) {
        setError(validation.error.errors[0].message);
        return;
      }

      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        if (isLogin) {
          navigate("/channels/general");
        } else {
          setIsLogin(true);
          alert("Registration successful! Please log in.");
        }
      } else {
        const data = await response.text();
        setError(data || "Authentication failed");
      }
    } catch (err) {
      setError("A server error occurred. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#313338] flex items-center justify-center p-4">
      <div className="bg-[#2b2d31] p-8 rounded-lg shadow-xl w-full max-w-md border border-[#1f2124]">
        <div className="text-center mb-8">
          <h1 className="text-white text-2xl font-bold mb-2">
            {isLogin ? "Welcome back!" : "Create an account"}
          </h1>
          <p className="text-[#b5bac1]">
            {isLogin ? "We're so excited to see you again!" : "Join the community today"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-[#b5bac1] text-xs font-bold uppercase mb-2">Username</label>
              <input
                type="text"
                className="w-full bg-[#1e1f22] text-white p-2 rounded border border-transparent focus:border-indigo-500 outline-none"
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
          )}
          <div>
            <label className="block text-[#b5bac1] text-xs font-bold uppercase mb-2">Email</label>
            <input
              type="email"
              className="w-full bg-[#1e1f22] text-white p-2 rounded border border-transparent focus:border-indigo-500 outline-none"
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-[#b5bac1] text-xs font-bold uppercase mb-2">Password</label>
            <input
              type="password"
              className="w-full bg-[#1e1f22] text-white p-2 rounded border border-transparent focus:border-indigo-500 outline-none"
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
          
          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button className="w-full bg-[#5865f2] hover:bg-[#4752c4] text-white font-bold py-2 rounded transition-colors">
            {isLogin ? "Log In" : "Continue"}
          </button>
        </form>

        <p className="mt-4 text-sm text-[#949ba4]">
          {isLogin ? "Need an account?" : "Already have an account?"}{" "}
          <span 
            className="text-[#00a8fc] cursor-pointer hover:underline"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? "Register" : "Login"}
          </span>
        </p>
      </div>
    </div>
  );
}
