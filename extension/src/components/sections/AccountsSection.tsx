import { Twitter, Github, ExternalLink, Users, Calendar, MessageCircle, Lock } from "lucide-react";
import PillBadge from "../PillBadge";

interface AccountsSectionProps {
  twitter: {
    username: string;
    displayName: string;
    avatar?: string;
    followers: number;
    following?: number;
    accountAge: string;
    bio: string;
    location?: string;
    lastActive: string;
    postsPerWeek: number;
    mediaCount?: number;
    isVerified?: boolean;
    isProtected?: boolean;
    status?: string;
    restId?: string;
    twitterId?: string;
    activity: "very-active" | "active" | "quiet";
  };
  github: {
    username: string;
    recentCommits: string;
    recentRepos: string[];
    tags: string[];
  };
}

const activityLabels = {
  "very-active": "Very active",
  "active": "Active",
  "quiet": "Quiet",
};

const AccountsSection = ({ twitter, github }: AccountsSectionProps) => {
  return (
    <div className="glass-card p-4">
      <p className="section-heading">Connected Platforms</p>

      {/* X Account Card */}
      <div className="bg-secondary/30 rounded-xl p-3 mb-2">
        <div className="flex items-center gap-2 mb-2">
          <Twitter className="w-3.5 h-3.5 text-[#1DA1F2]" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">X Account</span>
        </div>

        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-[#1DA1F2]/10 flex items-center justify-center border border-[#1DA1F2]/30 shrink-0">
            {twitter.avatar ? (
              <img src={twitter.avatar} alt="" className="w-full h-full rounded-full" />
            ) : (
              <Twitter className="w-6 h-6 text-[#1DA1F2]" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-foreground">{twitter.displayName}</span>
              {twitter.isProtected && (
                <Lock className="w-3 h-3 text-muted-foreground" />
              )}
              <span className={`activity-badge ${twitter.activity}`}>
                {activityLabels[twitter.activity]}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">@{twitter.username}</p>
            
            {/* Stats row */}
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3 text-primary" />
                <span className="text-xs font-bold text-foreground">
                  {twitter.followers.toLocaleString()}
                </span>
                <span className="text-[9px] text-muted-foreground">followers</span>
              </div>
              {twitter.following !== undefined && twitter.following > 0 && (
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {twitter.following.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-muted-foreground">following</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">{twitter.accountAge}</span>
              </div>
              {twitter.location && (
                <div className="flex items-center gap-1">
                  <span className="text-[9px] text-muted-foreground">{twitter.location}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="mt-2 p-2 bg-background/30 rounded-lg">
          <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">
            {twitter.bio}
          </p>
        </div>

        {/* Activity Indicators */}
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="bg-background/30 rounded-lg p-2">
            <div className="flex items-center gap-1 mb-0.5">
              <MessageCircle className="w-2.5 h-2.5 text-muted-foreground" />
              <span className="text-[8px] text-muted-foreground uppercase">Avg Posts/Week</span>
            </div>
            <p className="text-sm font-bold text-primary">{twitter.postsPerWeek}</p>
          </div>
          
          <div className="bg-background/30 rounded-lg p-2">
            <div className="flex items-center gap-1 mb-0.5">
              <Calendar className="w-2.5 h-2.5 text-muted-foreground" />
              <span className="text-[8px] text-muted-foreground uppercase">Last Active</span>
            </div>
            <p className="text-sm font-bold text-foreground">{twitter.lastActive}</p>
          </div>
        </div>

        {/* Open Profile Link - Only show if Twitter account exists */}
        {twitter.username !== "no_twitter" && (
        <a
          href={`https://twitter.com/${twitter.username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 flex items-center justify-center gap-2 py-1.5 px-3 bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 border border-[#1DA1F2]/30 rounded-lg transition-colors group"
        >
          <span className="text-[10px] font-medium text-[#1DA1F2]">View on X</span>
          <ExternalLink className="w-3 h-3 text-[#1DA1F2]" />
        </a>
        )}
      </div>

      {/* GitHub Card */}
      <div className="bg-secondary/30 rounded-xl p-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-[#6e5494]/10 flex items-center justify-center border border-[#6e5494]/30 shrink-0">
            <Github className="w-5 h-5 text-[#6e5494]" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-foreground">{github.username}</span>
              <span className="text-[10px] text-muted-foreground">
                {github.recentCommits}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              {github.tags.map((tag) => (
                <PillBadge key={tag} variant="muted" className="text-[9px] py-0.5 px-2">
                  {tag}
                </PillBadge>
              ))}
            </div>
          </div>
          
          <a
            href={`https://github.com/${github.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
          </a>
        </div>
      </div>

      <p className="text-[8px] text-muted-foreground/50 text-center mt-3">
        Based on public data • Updated hourly
      </p>
    </div>
  );
};

export default AccountsSection;
