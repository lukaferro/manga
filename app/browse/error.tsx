"use client";

import { useEffect } from "react";
import styles from "./browse.module.css";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '4rem 2rem', 
      textAlign: 'center',
      color: 'var(--foreground)'
    }}>
      <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Something went wrong!</h2>
      <p style={{ color: 'var(--muted)', marginBottom: '2rem', maxWidth: '500px' }}>
        We encountered an unexpected error while loading the media. This might be a temporary issue with the API.
      </p>
      <button 
        onClick={() => reset()} 
        style={{ 
          padding: '0.75rem 1.5rem', 
          background: 'var(--accent)', 
          color: 'white', 
          border: 'none', 
          borderRadius: '0.5rem', 
          cursor: 'pointer',
          fontWeight: '600'
        }}
      >
        Try again
      </button>
    </div>
  );
}
