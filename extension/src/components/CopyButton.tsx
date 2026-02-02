import { useState } from "react";
import { Copy, Check, Sparkles } from "lucide-react";

interface CopyButtonProps {
  text: string;
  className?: string;
}

const CopyButton = ({ text, className = "" }: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);
  const [showSparkle, setShowSparkle] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setShowSparkle(true);
    
    setTimeout(() => setCopied(false), 2000);
    setTimeout(() => setShowSparkle(false), 500);
  };

  return (
    <button
      onClick={handleCopy}
      className={`relative p-1.5 rounded-lg transition-all duration-200 hover:bg-primary/10 active:scale-95 ${className}`}
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-primary" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
      )}
      {showSparkle && (
        <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-primary animate-ping" />
      )}
    </button>
  );
};

export default CopyButton;
