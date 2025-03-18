"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "./components/ui/button"
import { Input } from "./components/ui/input"
import { Label } from "./components/ui/label"
import { Card, CardContent, CardFooter, CardHeader } from "./components/ui/card"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter(); // Add this

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      const endpoint = isLogin ? "/login" : "/signup";
      const response = await fetch(`http://localhost:3001${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || data.error || "Authentication failed");
      }
      
      if (!isLogin) {
        // SIGNUP FLOW - AUTO LOGIN
        // After successful signup, log the user in automatically
        const loginResponse = await fetch(`http://localhost:3001/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        
        const loginData = await loginResponse.json();
        
        if (!loginResponse.ok) {
          throw new Error("Signup successful, but couldn't log you in automatically. Please log in manually.");
        }
        
        // Store login data and redirect
        localStorage.setItem("token", loginData.token);
        localStorage.setItem("user", JSON.stringify(loginData.user));
        
        // Redirect to home
        router.push("/home");
        return;
      }
      
      // LOGIN FLOW (unchanged)
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      router.push("/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center p-6">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
              <div className="text-indigo-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2a8 8 0 0 0-8 8v12l6.5-6.5a8 8 0 1 0 1.5-13.5Z" />
                  <path d="M12 2a8 8 0 0 1 8 8v12l-6.5-6.5a8 8 0 0 1-1.5-13.5Z" />
                </svg>
              </div>
            </div>
          </div>
          <h2 className="text-2xl font-bold">Second Brain</h2>
          <p className="text-sm text-gray-500">
            {isLogin ? "Login to access your second brain" : "Create your second brain account"}
          </p>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 p-6 pt-0">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {isLogin && (
                  <Link href="#" className="text-xs text-indigo-600 hover:underline">
                    Forgot password?
                  </Link>
                )}
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            {error && (
              <div className="bg-red-50 p-3 rounded-md text-sm text-red-600">
                {error}
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4 p-6 pt-0">
            <Button 
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : (isLogin ? "Login" : "Sign Up")}
            </Button>
            
            <div className="text-center text-sm">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                }}
                className="text-indigo-600 hover:underline font-medium"
              >
                {isLogin ? "Sign Up" : "Login"}
              </button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}