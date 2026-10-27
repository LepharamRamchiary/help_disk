"use client";

import { GoogleLogin } from "@react-oauth/google";
import { useState } from "react";

interface GoogleAuthButtonProps {
  onCredential: (credential: string) => Promise<void>;
  onError: (message: string) => void;
}

export default function GoogleAuthButton({ onCredential, onError }: GoogleAuthButtonProps) {
  const [processing, setProcessing] = useState(false);

  if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
    return (
      <p className="text-center text-xs text-[#64748B]">
        Google sign-in is unavailable until NEXT_PUBLIC_GOOGLE_CLIENT_ID is configured.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2" aria-busy={processing}>
      <div className="w-full border-t border-[#E2E8F0]" />
      {processing ? (
        <p role="status" className="text-xs text-[#64748B]">
          Signing in with Google…
        </p>
      ) : (
        <GoogleLogin
          text="continue_with"
          onSuccess={async ({ credential }) => {
            if (!credential) {
              onError("Google did not return a sign-in credential. Please try again.");
              return;
            }
            setProcessing(true);
            try {
              await onCredential(credential);
            } finally {
              setProcessing(false);
            }
          }}
          onError={() => onError("Google sign-in failed. Please try again.")}
        />
      )}
    </div>
  );
}
