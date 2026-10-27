"use client";
import { GoogleLogin } from "@react-oauth/google";
import { useRouter } from "next/navigation";

export default function GoogleAuthButton() {
  const router = useRouter();

  return (
    <GoogleLogin
      onSuccess={async ({ credential }) => {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/google`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ credential }),
          },
        );
        const json = await res.json();

        if (!res.ok) return alert(json.message);

        localStorage.setItem("token", json.data.token); // see the note on cookies below
        router.push("/dashboard");
      }}
      onError={() => alert("Google sign-in failed")}
    />
  );
}
