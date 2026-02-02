import { Eye } from "lucide-react";
import CopyButton from "./CopyButton";
import PillBadge from "./PillBadge";

interface TokenContextProps {
  mint: string;
}

const TokenContext = ({ mint }: TokenContextProps) => {
  const shortenedMint = `${mint.slice(0, 6)}...${mint.slice(-4)}`;

  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Eye className="w-4 h-4 text-primary animate-glow-pulse" />
        <span className="text-sm text-muted-foreground">Looking at this one 👀</span>
      </div>
      
      <div className="flex items-center gap-2">
        <PillBadge variant="primary" className="font-mono text-sm">
          {shortenedMint}
        </PillBadge>
        <CopyButton text={mint} />
      </div>
      
      <p className="text-[10px] text-muted-foreground mt-3 uppercase tracking-wider">
        Context for this launch
      </p>
    </div>
  );
};

export default TokenContext;
