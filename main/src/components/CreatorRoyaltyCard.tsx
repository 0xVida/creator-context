"use client";

import { User, Wallet, ExternalLink, Twitter } from "lucide-react";
import CopyButton from "./CopyButton";
import PillBadge from "./PillBadge";

interface CreatorRoyaltyCardProps {
  creator: {
    username: string;
    pfp: string;
    royaltyBps: number;
    isCreator: boolean;
    wallet: string;
    provider: string;
    providerUsername: string | null;
    bagsUsername?: string;
    twitterUsername?: string;
  };
}

const CreatorRoyaltyCard = ({ creator }: CreatorRoyaltyCardProps) => {
  const royaltyPercentage = (creator.royaltyBps / 100).toFixed(2);
  const shortenedWallet = `${creator.wallet.slice(0, 6)}...${creator.wallet.slice(-4)}`;

  return (
    <div className="glass-card p-4">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border border-primary/30 shrink-0 overflow-hidden">
          {creator.pfp && creator.pfp !== "https://s3.us-east-1.amazonaws.com/bags.brand/default_pfp.png" ? (
            <img
              src={creator.pfp}
              alt={creator.username}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <User className="w-8 h-8 text-primary" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h3 className="font-bold text-base text-foreground">{creator.username}</h3>
            {creator.isCreator && (
              <PillBadge variant="primary" className="text-[9px]">
                Creator
              </PillBadge>
            )}
            <PillBadge variant="primary" className="text-[9px]">
              {royaltyPercentage}% Royalty
            </PillBadge>
          </div>

          {/* Wallet */}
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-3.5 h-3.5 text-muted-foreground" />
            <PillBadge className="font-mono text-xs">{shortenedWallet}</PillBadge>
            <CopyButton text={creator.wallet} />
          </div>

          {/* Provider Info */}
          <div className="flex items-center gap-3 flex-wrap">
            {creator.provider === "twitter" && creator.twitterUsername && (
              <a
                href={`https://twitter.com/${creator.twitterUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[10px] text-[#1DA1F2] hover:text-[#1DA1F2]/80 transition-colors"
              >
                <Twitter className="w-3 h-3" />
                <span>@{creator.twitterUsername}</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
            {creator.bagsUsername && (
              <a
                href={`https://bags.fm/${creator.bagsUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[10px] text-primary hover:text-primary/80 transition-colors"
              >
                <span>Bags: {creator.bagsUsername}</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorRoyaltyCard;
