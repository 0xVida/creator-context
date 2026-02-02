"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TokenMintInputProps {
  onSearch: (mint: string) => void;
  loading: boolean;
}

const TokenMintInput = ({ onSearch, loading }: TokenMintInputProps) => {
  const [mint, setMint] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(mint);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Enter token mint address..."
          value={mint}
          onChange={(e) => setMint(e.target.value)}
          disabled={loading}
          className="flex-1 font-mono text-sm"
        />
        <Button
          type="submit"
          disabled={loading || !mint.trim()}
          className="px-6"
        >
          {loading ? (
            "Loading..."
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              Search
            </>
          )}
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground">
        Enter a Bags token mint address to view creator context
      </p>
    </form>
  );
};

export default TokenMintInput;
