import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function lamportsToSol(lamports: string | number): string {
  const LAMPORTS_PER_SOL = 1_000_000_000;
  const lamportsNum = typeof lamports === "string" ? parseFloat(lamports) : lamports;
  const sol = lamportsNum / LAMPORTS_PER_SOL;
  
  const formatted = sol.toFixed(2);
  const cleaned = formatted.replace(/\.?0+$/, "");
  return `${cleaned} SOL`;
}


export function getMainAppUrl(): string {
  const env = "development";
  if (env === "development") {
    return "http://localhost:3000";
  }
  return "https://your-nextjs-app.vercel.app";
}

export function extractTokenMintFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === "bags.fm" || urlObj.hostname === "www.bags.fm") {
      const path = urlObj.pathname;
      const tokenMint = path.replace(/^\//, "");
      if (tokenMint && tokenMint.length >= 20 && /^[A-Za-z0-9]+$/.test(tokenMint)) {
        return tokenMint;
      }
    }
  } catch (error) {
    console.error("Error parsing URL:", error);
  }
  return null;
}
