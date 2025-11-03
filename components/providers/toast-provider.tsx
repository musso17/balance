"use client";

import { Toaster } from "react-hot-toast";

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          fontSize: "0.875rem",
          borderRadius: "12px",
          border: "1px solid hsl(210 14% 89%)",
        },
      }}
    />
  );
}

