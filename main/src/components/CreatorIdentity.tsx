"use client";

import { User, DollarSign, Percent, ChevronLeft, ChevronRight } from "lucide-react";
import CopyButton from "./CopyButton";
import PillBadge from "./PillBadge";
import { Button } from "./ui/button";

interface CreatorIdentityProps {
  wallet: string;
  royaltyBps?: number;
  totalFeesClaimed: string;
  username?: string;
  avatar?: string;
  hasMultipleCreators?: boolean;
  currentIndex?: number;
  totalCreators?: number;
  onPrevious?: () => void;
  onNext?: () => void;
}

const CreatorIdentity = ({ 
  wallet, 
  royaltyBps, 
  totalFeesClaimed, 
  username, 
  avatar,
  hasMultipleCreators = false,
  currentIndex = 0,
  totalCreators = 1,
  onPrevious,
  onNext,
}: CreatorIdentityProps) => {
  const shortenedWallet = `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
  const royaltyPercentage = royaltyBps ? (royaltyBps / 100).toFixed(2) : null;

  return (
    <div className="glass-card p-4 relative">
      <div className="flex items-center justify-between mb-2">
        <p className="section-heading mb-0">Creator</p>
        {hasMultipleCreators && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onPrevious}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-[10px] text-muted-foreground font-mono px-1">
              {currentIndex + 1}/{totalCreators}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onNext}
              disabled={currentIndex === totalCreators - 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 overflow-hidden shrink-0">
            {avatar && avatar !== "https://s3.us-east-1.amazonaws.com/bags.brand/default_pfp.png" ? (
              <img src={avatar} alt={username || ""} className="w-full h-full object-cover" />
            ) : (
              <User className="w-4 h-4 text-primary" />
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {username && (
              <PillBadge variant="primary" className="text-xs">
                {username}
              </PillBadge>
            )}
            <PillBadge className="font-mono">{shortenedWallet}</PillBadge>
            <CopyButton text={wallet} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {royaltyPercentage !== null ? (
          <div className="bg-secondary/30 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Percent className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Fee Allocation</span>
            </div>
            <p className="stat-number">{royaltyPercentage}%</p>
            <p className="text-[9px] text-muted-foreground mt-1">royalty share</p>
          </div>
        ) : (
          <div className="bg-secondary/30 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Percent className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Fee Allocation</span>
            </div>
            <p className="stat-number">N/A</p>
            <p className="text-[9px] text-muted-foreground mt-1">royalty share</p>
          </div>
        )}
        
        <div className="bg-secondary/30 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <DollarSign className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Claimed</span>
          </div>
          <p className="stat-number text-lg">{totalFeesClaimed}</p>
          <p className="text-[9px] text-muted-foreground mt-1">total fees claimed</p>
        </div>
      </div>

      <p className="text-[9px] text-muted-foreground/60 mt-3 text-center italic">
        Not full history • Data from lookups only
      </p>
    </div>
  );
};

export default CreatorIdentity;
