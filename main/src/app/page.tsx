"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import TokenMintInput from "@/components/TokenMintInput";
import TokenContext from "@/components/TokenContext";
import CreatorIdentity from "@/components/CreatorIdentity";
import AccountsSection from "@/components/sections/AccountsSection";
import ActivitySection from "@/components/sections/ActivitySection";
import NetworkSection from "@/components/sections/NetworkSection";
import { lamportsToSol, transformTwitterData, processTimelineData, type TwitterApiResponse, type TwitterTimelineResponse } from "@/lib/utils";

interface CreatorData {
  username: string;
  pfp: string;
  royaltyBps: number;
  isCreator: boolean;
  wallet: string;
  provider: string;
  providerUsername: string | null;
  totalClaimed?: string;
  bagsUsername?: string;
  twitterUsername?: string;
}


export default function Home() {
  const [mint, setMint] = useState<string>("");
  const [creators, setCreators] = useState<CreatorData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentCreatorIndex, setCurrentCreatorIndex] = useState(0);
  
  const [twitterDataCache, setTwitterDataCache] = useState<Map<string, TwitterApiResponse>>(new Map());
  const [timelineDataCache, setTimelineDataCache] = useState<Map<string, {
    postsData: Array<{ day: string; posts: number }>;
    engagementData: Array<{ day: string; likes: number; replies: number }>;
  }>>(new Map());
  
  const [twitterDetails, setTwitterDetails] = useState<TwitterApiResponse | null>(null);
  const [twitterLoading, setTwitterLoading] = useState(false);
  const [twitterError, setTwitterError] = useState<string | null>(null);
  const [timelineData, setTimelineData] = useState<{
    postsData: Array<{ day: string; posts: number }>;
    engagementData: Array<{ day: string; likes: number; replies: number }>;
  } | null>(null);
  const [timelineLoading, setTimelineLoading] = useState(false);

  const handleSearch = async (mintAddress: string) => {
    if (!mintAddress.trim()) {
      setError("Please enter a token mint address");
      return;
    }

    setLoading(true);
    setError(null);
    setCreators([]);
    setHasSearched(false);

    try {
      const [creatorsResponse, claimStatsResponse] = await Promise.all([
        fetch(`/api/token-creators?mint=${encodeURIComponent(mintAddress.trim())}`),
        fetch(`/api/token-claim-stats?mint=${encodeURIComponent(mintAddress.trim())}`),
      ]);

      const creatorsData = await creatorsResponse.json();
      const claimStatsData = await claimStatsResponse.json();

      console.log("Creators API response:", creatorsData);
      console.log("Claim Stats API response:", claimStatsData);

      if (!creatorsData.success) {
        setError(creatorsData.error || "Failed to fetch token creators");
        setHasSearched(true);
        return;
      }

      if (!claimStatsData.success) {
        setError(claimStatsData.error || "Failed to fetch claim stats");
        setHasSearched(true);
        return;
      }

      const creatorsMap = new Map<string, CreatorData>(
        (creatorsData.response as CreatorData[]).map((creator) => {
          console.log("Creator from creators API:", creator);
          return [creator.wallet, creator];
        })
      );
      
      (claimStatsData.response as Array<CreatorData & { totalClaimed: string }>).forEach((claimStat) => {
        console.log("Claim stat:", claimStat);
        const existing = creatorsMap.get(claimStat.wallet);
        if (existing) {
          existing.totalClaimed = claimStat.totalClaimed;
          if (!existing.providerUsername && claimStat.providerUsername) {
            existing.providerUsername = claimStat.providerUsername;
          }
          if (claimStat.provider === "twitter" && claimStat.providerUsername) {
            existing.twitterUsername = claimStat.providerUsername;
            console.log("Set Twitter username for existing creator:", claimStat.providerUsername);
          }
        } else {
          const newCreator: CreatorData = {
            ...claimStat,
            bagsUsername: undefined,
            twitterUsername: claimStat.provider === "twitter" ? claimStat.providerUsername || null : undefined,
          };
          if (newCreator.twitterUsername) {
            console.log("Set Twitter username for new creator:", newCreator.twitterUsername);
          }
          creatorsMap.set(claimStat.wallet, newCreator);
        }
      });

      const mergedCreators = Array.from(creatorsMap.values());
      console.log("Merged creators data:", mergedCreators);

      setMint(mintAddress.trim());
      setCreators(mergedCreators);
      setCurrentCreatorIndex(0);
      setHasSearched(true);

      const firstCreator = mergedCreators[0];
      if (firstCreator) {
        const twitterUsername = firstCreator.twitterUsername || firstCreator.providerUsername;
        
        if (twitterUsername) {
          console.log("Fetching Twitter details for first creator:", twitterUsername);
          fetchTwitterDetailsForCreator(twitterUsername);
        } else {
          console.log("No username found for first creator:", {
            hasCreator: !!firstCreator,
            provider: firstCreator?.provider,
            twitterUsername: firstCreator?.twitterUsername,
            providerUsername: firstCreator?.providerUsername,
          });
          setTwitterDetails(null);
          setTwitterError(null);
        }
      } else {
        setTwitterDetails(null);
        setTwitterError(null);
      }
    } catch (err) {
      setError("An error occurred while fetching data");
      setHasSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchTwitterDetailsForCreator = async (twitterUsername: string) => {
    const cachedData = twitterDataCache.get(twitterUsername);
    if (cachedData) {
      console.log("Using cached Twitter data for:", twitterUsername);
      setTwitterLoading(false);
      setTwitterError(null);
      setTwitterDetails(cachedData);
      
      const cachedTimeline = timelineDataCache.get(twitterUsername);
      if (cachedTimeline) {
        console.log("Using cached timeline data for:", twitterUsername);
        setTimelineLoading(false);
        setTimelineData(cachedTimeline);
      } else {
        fetchTimelineForCreator(twitterUsername);
      }
      return;
    }

    console.log("Fetching Twitter details for:", twitterUsername);
    setTwitterLoading(true);
    setTwitterError(null);

    try {
      const url = new URL("/api/twitter-details", window.location.origin);
      url.searchParams.set("screenname", twitterUsername);

      console.log("Twitter API URL:", url.toString());
      const response = await fetch(url.toString());
      const data = await response.json();

      console.log("Twitter API response:", {
        ok: response.ok,
        status: response.status,
        data,
      });

      if (!response.ok || !data.success) {
        console.error("Twitter API error:", data.error);
        setTwitterError(data.error || "Failed to fetch Twitter details");
        setTwitterDetails(null);
        return;
      }

      console.log("Twitter API success - caching and setting details:", data.response);
      setTwitterDataCache(prev => new Map(prev).set(twitterUsername, data.response));
      setTwitterDetails(data.response);
      fetchTimelineForCreator(twitterUsername);
    } catch (err) {
      console.error("Twitter fetch error:", err);
      setTwitterError("An error occurred while fetching Twitter details");
      setTwitterDetails(null);
    } finally {
      setTwitterLoading(false);
    }
  };

  const fetchTimelineForCreator = async (twitterUsername: string) => {
    const cachedTimeline = timelineDataCache.get(twitterUsername);
    if (cachedTimeline) {
      console.log("Using cached timeline data for:", twitterUsername);
      setTimelineData(cachedTimeline);
      return;
    }

    console.log("Fetching Twitter timeline for:", twitterUsername);
    setTimelineLoading(true);

    try {
      const url = new URL("/api/twitter-timeline", window.location.origin);
      url.searchParams.set("screenname", twitterUsername);

      console.log("Twitter Timeline API URL:", url.toString());
      const response = await fetch(url.toString());
      const data = await response.json();

      console.log("Twitter Timeline API response:", {
        ok: response.ok,
        status: response.status,
        hasData: !!data.response,
      });

      if (!response.ok || !data.success) {
        console.error("Twitter Timeline API error:", data.error);
        setTimelineData(null);
        return;
      }

      const processed = processTimelineData(data.response as TwitterTimelineResponse);
      console.log("Processed timeline data:", processed);
      
      setTimelineDataCache(prev => new Map(prev).set(twitterUsername, processed));
      setTimelineData(processed);
    } catch (err) {
      console.error("Twitter timeline fetch error:", err);
      setTimelineData(null);
    } finally {
      setTimelineLoading(false);
    }
  };

  const currentCreator = creators.length > 0 ? creators[currentCreatorIndex] : null;

  useEffect(() => {
    if (!currentCreator) {
      setTwitterDetails(null);
      setTwitterError(null);
      setTimelineData(null);
      setTwitterLoading(false);
      setTimelineLoading(false);
      return;
    }

    const twitterUsername = currentCreator.twitterUsername || currentCreator.providerUsername;

    if (!twitterUsername) {
      console.log("Skipping Twitter fetch - no username:", {
        hasCreator: !!currentCreator,
        provider: currentCreator?.provider,
        twitterUsername: currentCreator?.twitterUsername,
        providerUsername: currentCreator?.providerUsername,
      });
      setTwitterDetails(null);
      setTwitterError(null);
      setTimelineData(null);
      setTwitterLoading(false);
      setTimelineLoading(false);
      return;
    }

    const cachedData = twitterDataCache.get(twitterUsername);
    const cachedTimeline = timelineDataCache.get(twitterUsername);
    
    if (cachedData) {
      console.log("Using cached data for creator switch:", twitterUsername);
      setTwitterLoading(false);
      setTwitterError(null);
      setTwitterDetails(cachedData);
      
      if (cachedTimeline) {
        setTimelineLoading(false);
        setTimelineData(cachedTimeline);
      } else {
        fetchTimelineForCreator(twitterUsername);
      }
    } else {
      fetchTwitterDetailsForCreator(twitterUsername);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCreatorIndex, currentCreator?.wallet, currentCreator?.twitterUsername, currentCreator?.providerUsername]);
  
  const handlePreviousCreator = () => {
    if (currentCreatorIndex > 0) {
      setCurrentCreatorIndex(currentCreatorIndex - 1);
    }
  };

  const handleNextCreator = () => {
    if (currentCreatorIndex < creators.length - 1) {
      setCurrentCreatorIndex(currentCreatorIndex + 1);
    }
  };

  const twitterDataFromAPI = (() => {
    if (!currentCreator) {
      return {
        username: "no_twitter",
        displayName: "No Creator",
  avatar: undefined,
        followers: 0,
        following: 0,
        accountAge: "N/A",
        bio: "No creator data available",
        lastActive: "N/A",
        postsPerWeek: 0,
        mediaCount: 0,
        isVerified: false,
        isProtected: false,
        status: undefined,
        restId: undefined,
        twitterId: undefined,
        activity: "quiet" as const,
      };
    }

    const twitterUsername = currentCreator.twitterUsername || currentCreator.providerUsername;
    const hasTwitterProvider = currentCreator.provider === "twitter";
    
    if (!twitterUsername) {
      return {
        username: "no_twitter",
        displayName: currentCreator.username || "Creator",
        avatar: currentCreator.pfp || undefined,
        followers: 0,
        following: 0,
        accountAge: "N/A",
        bio: "No Twitter account connected",
        lastActive: "N/A",
        postsPerWeek: 0,
        mediaCount: 0,
        isVerified: false,
        isProtected: false,
        status: undefined,
        restId: undefined,
        twitterId: undefined,
        activity: "quiet" as const,
};
    }

    if (twitterDetails) {
      const transformed = transformTwitterData(
        twitterDetails,
        twitterUsername,
        currentCreator.pfp
      );
      console.log("Transformed Twitter data:", transformed);
      return transformed;
    }

    if (twitterLoading) {
      return {
        username: twitterUsername,
        displayName: currentCreator.username || twitterUsername,
        avatar: currentCreator.pfp || undefined,
        followers: 0,
        following: 0,
        accountAge: "Loading...",
        bio: "Loading Twitter data...",
        lastActive: "Loading...",
        postsPerWeek: 0,
        mediaCount: 0,
        isVerified: false,
        isProtected: false,
        status: undefined,
        restId: undefined,
        twitterId: undefined,
        activity: "quiet" as const,
      };
    }

    return {
      username: twitterUsername,
      displayName: currentCreator.username || twitterUsername,
      avatar: currentCreator.pfp || undefined,
      followers: 0,
      following: 0,
      accountAge: "Unknown",
      bio: twitterError || "Unable to load Twitter data",
      lastActive: "Unknown",
      postsPerWeek: 0,
      mediaCount: 0,
      isVerified: false,
      isProtected: false,
      status: undefined,
      restId: undefined,
      twitterId: undefined,
      activity: "quiet" as const,
    };
  })();
  
  console.log("Final twitterDataFromAPI:", twitterDataFromAPI);

  return (
    <div className="min-h-screen bg-background relative scanlines flex flex-col">
      <div className="noise-overlay" />

      <header className="sticky top-0 z-20 px-4 md:px-8 py-[-5px] bg-background/80 backdrop-blur-xl border-b border-border/50 shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt="Bags Creator Context" 
              className="h-16 md:h-20 w-auto"
            />
            <span className="hidden md:block font-cyber text-lg font-bold tracking-wide bg-gradient-to-r from-primary via-primary to-primary/80 bg-clip-text text-transparent">
              BAGS CREATOR CONTEXT
            </span>
          </div>
          <span className="text-[10px] md:text-xs text-muted-foreground font-mono">v0.1.0</span>
        </div>
      </header>

      <main className="relative z-10 px-4 md:px-8 py-6 md:py-8 flex-1 flex flex-col">
        <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">
          <div className="flex-1 space-y-4 md:space-y-6">
            <div className="glass-card p-4 md:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Token Mint Lookup</h2>
            </div>
            <TokenMintInput onSearch={handleSearch} loading={loading} />
            {error && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
          </div>

          {loading && (
            <div className="glass-card p-8 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
              <span className="ml-3 text-muted-foreground">Fetching creator data...</span>
            </div>
          )}

          {!loading && hasSearched && creators.length > 0 && currentCreator && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {mint && <TokenContext mint={mint} />}
                
                <CreatorIdentity 
                  wallet={currentCreator.wallet}
                  royaltyBps={currentCreator.royaltyBps}
                  totalFeesClaimed={
                    currentCreator.totalClaimed 
                      ? lamportsToSol(currentCreator.totalClaimed)
                      : "0 SOL"
                  }
                  username={currentCreator.username}
                  avatar={currentCreator.pfp}
                  hasMultipleCreators={creators.length > 1}
                  currentIndex={currentCreatorIndex}
                  totalCreators={creators.length}
                  onPrevious={handlePreviousCreator}
                  onNext={handleNextCreator}
                />
              </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {twitterLoading ? (
                  <div className="glass-card p-4">
                    <Skeleton className="h-64 w-full" />
                  </div>
                ) : twitterError ? (
                  <div className="glass-card p-4">
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertCircle className="w-4 h-4" />
                      <p className="text-sm">Failed to load Twitter data: {twitterError}</p>
                    </div>
                  </div>
                ) : (
                  <AccountsSection 
                    twitter={twitterDataFromAPI} 
                    github={{
                      username: "N/A",
                      recentCommits: "No GitHub data",
                      recentRepos: [],
                      tags: [],
                    }} 
                  />
                )}

                {timelineLoading ? (
                  <div className="glass-card p-4">
                    <Skeleton className="h-64 w-full" />
                  </div>
                ) : timelineData ? (
                  <ActivitySection 
                    postsData={timelineData.postsData}
                    engagementData={timelineData.engagementData}
                  />
                ) : (
                  <div className="glass-card p-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <AlertCircle className="w-4 h-4" />
                      <p className="text-sm">No activity data available</p>
                    </div>
                  </div>
                )}
          </div>

          <NetworkSection />
            </>
          )}

          {!loading && hasSearched && creators.length === 0 && (
            <div className="glass-card p-8 text-center">
              <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No creators found for this token mint.</p>
            </div>
          )}

          {!loading && hasSearched && creators.length === 0 && !error && (
            <div className="glass-card p-8 text-center">
              <p className="text-muted-foreground">
                No royalty claimers found for this token mint.
              </p>
            </div>
          )}
          </div>
        </div>
      </main>

      <footer className="relative z-10 px-4 md:px-8 py-4 shrink-0">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-[10px] md:text-xs text-muted-foreground/50 leading-relaxed">
            Context, not advice • Built for curious degens 🦎
          </p>
        </div>
      </footer>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />
    </div>
  );
}
