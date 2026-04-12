"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    country: "Tanzania" // Defaulting to your home market
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Direct connection to your Node.js backend
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Registration failed");
      }

      // Success: Send them to login
      router.push("/login");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-2xl font-bold text-gray-900 text-center">Join nn-fintech</h1>
        
        {error && <div className="mb-4 text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            required
            className="w-full rounded-md border p-2 text-black"
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
          <input
            type="email"
            placeholder="Email Address"
            required
            className="w-full rounded-md border p-2 text-black"
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
          <input
            type="password"
            placeholder="Create Password"
            required
            className="w-full rounded-md border p-2 text-black"
            onChange={(e) => setFormData({...formData, password: e.target.value})}
          />
          <select 
            className="w-full rounded-md border p-2 text-black"
            onChange={(e) => setFormData({...formData, country: e.target.value})}
            value={formData.country}
          >
            <option value="Tanzania">Tanzania</option>
            <option value="Kenya">Kenya</option>
            <option value="Uganda">Uganda</option>
            <option value="USA">USA</option>
          </select>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-black py-2 text-white font-bold hover:bg-gray-800 disabled:bg-gray-400"
          >
            {isLoading ? "Creating Account..." : "Register Now"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account? <a href="/login" className="text-black font-bold">Login</a>
        </p>
      </div>
    </div>
  );
}