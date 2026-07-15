"use client";

import { useEffect, useRef } from "react";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const GSI_SRC = "https://accounts.google.com/gsi/client";

type GoogleAccounts = {
  accounts: {
    id: {
      initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void;
      renderButton: (el: HTMLElement, options: Record<string, unknown>) => void;
    };
  };
};

/**
 * Renders the Google Identity Services button and hands the returned ID token to `onToken`.
 * Renders nothing when NEXT_PUBLIC_GOOGLE_CLIENT_ID is unset (Google sign-in disabled).
 */
export function GoogleButton({
  onToken,
  text = "signin_with",
}: {
  onToken: (idToken: string) => void;
  text?: "signin_with" | "signup_with" | "continue_with";
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onToken);
  callbackRef.current = onToken;

  useEffect(() => {
    if (!CLIENT_ID) {
      return;
    }

    function init() {
      const google = (window as unknown as { google?: GoogleAccounts }).google;
      if (!google?.accounts?.id || !containerRef.current) {
        return;
      }
      google.accounts.id.initialize({
        client_id: CLIENT_ID as string,
        callback: (response) => callbackRef.current(response.credential),
      });
      google.accounts.id.renderButton(containerRef.current, {
        theme: "outline",
        size: "large",
        text,
        width: 320,
        logo_alignment: "center",
      });
    }

    if ((window as unknown as { google?: GoogleAccounts }).google?.accounts?.id) {
      init();
      return;
    }

    let script = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`);
    let created = false;
    if (!script) {
      script = document.createElement("script");
      script.src = GSI_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      created = true;
    }
    script.addEventListener("load", init);
    return () => {
      script?.removeEventListener("load", init);
      if (created) {
        // leave the script cached for other pages
      }
    };
  }, [text]);

  if (!CLIENT_ID) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-center" ref={containerRef} />
      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}
