"use client";

import { useState, useEffect } from "react";
import { Twitter, ExternalLink, Sparkles, Loader2, AlertCircle } from "lucide-react";
import PillBadge from "../PillBadge";
import { Skeleton } from "@/components/ui/skeleton";

interface RecommendedUser {
  username: string;
  displayName: string;
  avatar?: string;
  reason: string;
  tags: string[];
}

const NetworkSection = () => {
  const [recommendedUsers, setRecommendedUsers] = useState<RecommendedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBuilders = async () => {
      setLoading(true);
      try {
        const url = new URL("/api/twitter-search", window.location.origin);
        url.searchParams.set("query", "solana build");
        url.searchParams.set("search_type", "Top");

        console.log("Fetching builders from Twitter search:", url.toString());
        const response = await fetch(url.toString());
        const data = await response.json();

        console.log("Twitter Search response:", data);

        if (response.ok && data.success && data.response?.timeline) {
          const { processSearchResults } = await import("@/lib/utils");
          const users = processSearchResults(data.response);
          console.log("Processed builders:", users);
          
          if (users.length > 0) {
            setRecommendedUsers(users);
          } else {
            setError("No builders found");
          }
        } else {
          setError(data.error || "Failed to fetch builders");
        }
      } catch (error) {
        console.error("Error fetching builders:", error);
        setError("Failed to load builder network");
      } finally {
        setLoading(false);
      }
    };

    fetchBuilders();
  }, []);
  const handlePingOnX = (username: string) => {
    const tweetText = encodeURIComponent(
      `gm @${username} 👀\nseen you shipping cool stuff — would love to see you launch something on @BagsApp`
    );
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, "_blank");
  };

  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-primary" />
        <p className="section-heading mb-0">Network</p>
      </div>
      
      <p className="text-[10px] text-muted-foreground mb-3">
        Similar builders who might launch on Bags
      </p>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-secondary/30 rounded-xl p-2.5">
              <Skeleton className="h-24 w-full" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-8">
          <AlertCircle className="w-5 h-5 text-destructive mb-2" />
          <p className="text-xs text-destructive">{error}</p>
        </div>
      ) : recommendedUsers.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <p className="text-xs text-muted-foreground">No builders found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {recommendedUsers.map((user) => (
          <div key={user.username} className="bg-secondary/30 rounded-xl p-2.5 group">
            <div className="flex items-start gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#1DA1F2]/10 flex items-center justify-center border border-[#1DA1F2]/30 shrink-0">
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="w-full h-full rounded-full" />
                ) : (
                  <Twitter className="w-4 h-4 text-[#1DA1F2]" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-foreground">{user.displayName}</span>
                    <p className="text-[10px] text-muted-foreground">@{user.username}</p>
                  </div>
                  <a
                    href={`https://twitter.com/${user.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 hover:bg-secondary rounded transition-colors"
                  >
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </a>
                </div>
                
                <p className="text-[9px] text-primary mt-0.5 italic">&ldquo;{user.reason}&rdquo;</p>

                <div className="flex items-center gap-1 mt-1 flex-wrap">
                  {user.tags.map((tag) => (
                    <PillBadge key={tag} variant="muted" className="text-[7px] py-0.5 px-1.5">
                      {tag}
                    </PillBadge>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => handlePingOnX(user.username)}
              className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg transition-all"
            >
              <Twitter className="w-3 h-3 text-primary" />
              <span className="text-[10px] font-medium text-primary">Ping on X</span>
            </button>
          </div>
          ))}
        </div>
      )}

      <p className="text-[8px] text-muted-foreground/50 text-center mt-3">
        Discovery, not endorsement • Keep it friendly 🤝
      </p>
    </div>
  );
};

export default NetworkSection;
