"use client";

import { useState, useEffect } from "react";
import { Loader2, AlertCircle, Search } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import TokenContext from "./TokenContext";
import CreatorIdentity from "./CreatorIdentity";
import AccountsSection from "./sections/AccountsSection";
import ActivitySection from "./sections/ActivitySection";
import NetworkSection from "./sections/NetworkSection";
import { lamportsToSol, getMainAppUrl, extractTokenMintFromUrl } from "@/lib/utils";

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
  twitterData?: any;
  timelineData?: {
    postsData: Array<{ day: string; posts: number }>;
    engagementData: Array<{ day: string; likes: number; replies: number }>;
  } | null;
}

interface NetworkUser {
  username: string;
  displayName: string;
  avatar?: string;
  reason: string;
  tags: string[];
}

interface ExtensionData {
  mint: string;
  creators: CreatorData[];
  network?: NetworkUser[];
}

const ExtensionPopup = () => {
  const [mint, setMint] = useState<string>("");
  const [detectedMint, setDetectedMint] = useState<string | null>(null);
  const [data, setData] = useState<ExtensionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentCreatorIndex, setCurrentCreatorIndex] = useState(0);
  const [checkingUrl, setCheckingUrl] = useState(true);
  const [manualMintInput, setManualMintInput] = useState("");

  useEffect(() => {
    const getMintFromCurrentTab = async () => {
      setCheckingUrl(true);
      
      const urlParams = new URLSearchParams(window.location.search);
      const mintFromUrl = urlParams.get("mint");
      
      if (mintFromUrl) {
        setMint(mintFromUrl);
        setCheckingUrl(false);
        return;
      }

      let currentTabMint: string | null = null;

      if (typeof window !== "undefined" && (window as any).chrome?.tabs) {
        try {
          const chrome = (window as any).chrome;
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab?.url) {
            const extractedMint = extractTokenMintFromUrl(tab.url);
            if (extractedMint) {
              currentTabMint = extractedMint;
              setDetectedMint(extractedMint);
            }
          }
        } catch (error) {
          console.error("error getting current tab:", error);
        }
      }

      if (typeof window !== "undefined" && (window as any).chrome?.storage) {
        const chrome = (window as any).chrome;
        chrome.storage.local.get(["lastMint"], async (result: { lastMint?: string }) => {
          const lastMint = result.lastMint;
          
          if (currentTabMint) {
            if (lastMint && lastMint !== currentTabMint) {
              console.log("mint changed, clearing cache:", { lastMint, currentTabMint });
              chrome.storage.local.remove([`extension_data_${lastMint}`]);
            }
          } else if (lastMint) {
            setMint(lastMint);
          }
          
          setCheckingUrl(false);
        });
      } else {
        setCheckingUrl(false);
      }
    };

    getMintFromCurrentTab();
  }, []);

  useEffect(() => {
    if (!mint) return;

    const fetchData = async () => {
      let useCache = false;
      if (typeof window !== "undefined" && (window as any).chrome?.storage) {
        const chrome = (window as any).chrome;
        const cacheResult = await new Promise<{ [key: string]: any }>((resolve) => {
          chrome.storage.local.get([`extension_data_${mint}`], (result: { [key: string]: any }) => {
            resolve(result);
          });
        });
        
        const cachedData = cacheResult[`extension_data_${mint}`];
        
        if (cachedData && cachedData.timestamp && Date.now() - cachedData.timestamp < 5 * 60 * 1000) {
          setData(cachedData.data);
          setCurrentCreatorIndex(0);
          useCache = true;
        }
      }

      if (useCache) return;

      setLoading(true);
      setError(null);

      try {
        const mainAppUrl = getMainAppUrl();
        const apiUrl = `${mainAppUrl}/api/extension-data?mint=${encodeURIComponent(mint)}`;
        
        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        console.log("response status:", response.status, response.statusText);

        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = "Failed to fetch data from server";
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.error || errorMessage;
          } catch {
            errorMessage = `Server error: ${response.status} ${response.statusText}`;
          }
          setError(errorMessage);
          return;
        }

        const result = await response.json();
        console.log("API Response:", result);

        if (!result.success) {
          setError(result.error || "Failed to fetch data");
          return;
        }

        setData(result.data);
        setCurrentCreatorIndex(0);

        if (typeof window !== "undefined" && (window as any).chrome?.storage) {
          const chrome = (window as any).chrome;
          chrome.storage.local.set({
            [`extension_data_${mint}`]: {
              data: result.data,
              timestamp: Date.now(),
            },
            lastMint: mint,
          });
        }
      } catch (err) {
        console.error("error fetching extension data:", err);
        let errorMessage = "Unknown error";
        
        if (err instanceof TypeError && err.message.includes("Failed to fetch")) {
          errorMessage = `Cannot connect to ${getMainAppUrl()}. Make sure the main app is running.`;
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }
        
        setError(`Failed to fetch data: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [mint]);

  const currentCreator = data?.creators[currentCreatorIndex] || null;

  const handlePreviousCreator = () => {
    if (currentCreatorIndex > 0) {
      setCurrentCreatorIndex(currentCreatorIndex - 1);
    }
  };

  const handleNextCreator = () => {
    if (data && currentCreatorIndex < data.creators.length - 1) {
      setCurrentCreatorIndex(currentCreatorIndex + 1);
    }
  };

  const handleFetchDetectedMint = async () => {
    if (detectedMint) {
      if (typeof window !== "undefined" && (window as any).chrome?.storage) {
        const chrome = (window as any).chrome;
        chrome.storage.local.get(["lastMint"], (result: { lastMint?: string }) => {
          const lastMint = result.lastMint;
          if (lastMint && lastMint !== detectedMint) {
            chrome.storage.local.remove([`extension_data_${lastMint}`]);
          }
        });
      }
      setMint(detectedMint);
      setDetectedMint(null);
    }
  };

  const handleDismissDetectedMint = () => {
    setDetectedMint(null);
  };

  const handleManualMintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMint = manualMintInput.trim();
    if (!trimmedMint) {
      setError("Please enter a token mint address");
      return;
    }

    if (typeof window !== "undefined" && (window as any).chrome?.storage) {
      const chrome = (window as any).chrome;
      chrome.storage.local.get(["lastMint"], (result: { lastMint?: string }) => {
        const lastMint = result.lastMint;
        if (lastMint && lastMint !== trimmedMint) {
          chrome.storage.local.remove([`extension_data_${lastMint}`]);
        }
      });
    }

    setMint(trimmedMint);
    setManualMintInput("");
    setDetectedMint(null);
  };
  return (
    <div className="w-[360px] min-h-[500px] bg-background relative scanlines flex flex-col">
      <div className="noise-overlay" />
      
      <div className="sticky top-0 z-20 px-4 py-2 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt="Bags Creator Context" 
              className="h-12 w-auto"
            />
          </div>
          <span className="text-[9px] text-muted-foreground font-mono">v0.1.0</span>
        </div>
      </div>

      <div className="p-3 relative z-10 flex-1 flex flex-col">
        <div className="flex-1 space-y-3">
          {!checkingUrl && (
            <div className="glass-card p-3 border border-primary/20">
              <form onSubmit={handleManualMintSubmit} className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Enter token mint address..."
                    value={manualMintInput}
                    onChange={(e) => setManualMintInput(e.target.value)}
                    disabled={loading}
                    className="flex-1 font-mono text-xs h-8"
                  />
                  <Button
                    type="submit"
                    disabled={loading || !manualMintInput.trim()}
                    size="sm"
                    className="px-3 h-8"
                  >
                    {loading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Search className="w-3 h-3" />
                    )}
                  </Button>
                </div>
                {data && (
                  <button
                    type="button"
                    onClick={() => {
                      setData(null);
                      setMint("");
                      setManualMintInput("");
                      setError(null);
                      if (typeof window !== "undefined" && (window as any).chrome?.storage) {
                        const chrome = (window as any).chrome;
                        chrome.storage.local.get(["lastMint"], (result: { lastMint?: string }) => {
                          if (result.lastMint) {
                            chrome.storage.local.remove([`extension_data_${result.lastMint}`, "lastMint"]);
                          }
                        });
                      }
                    }}
                    className="text-[9px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Clear & Search New
                  </button>
                )}
            </form>
          </div>
        )}

        {detectedMint && !mint && (
            <div className="glass-card p-4 border border-primary/30">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                  <Search className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground mb-1">
                    Token Mint Detected
                  </p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Found token mint from current page:
                  </p>
                  <div className="font-mono text-xs bg-secondary/50 px-2 py-1 rounded break-all mb-3">
                    {detectedMint.slice(0, 20)}...{detectedMint.slice(-10)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleFetchDetectedMint}
                      size="sm"
                      className="flex-1"
                    >
                      Fetch Data
                    </Button>
                    <Button
                      onClick={handleDismissDetectedMint}
                      variant="ghost"
                      size="sm"
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {checkingUrl ? (
            <div className="glass-card p-4 text-center">
              <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2 text-primary" />
              <p className="text-xs text-muted-foreground">Checking current page...</p>
            </div>
          ) : loading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : error ? (
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-4 h-4" />
                <p className="text-sm">{error}</p>
              </div>
            </div>
          ) : !data || !currentCreator ? (
            <div className="glass-card p-4 text-center">
              <p className="text-sm text-muted-foreground">
                {mint ? "No creators found for this token mint." : "Enter a token mint to view creator data."}
              </p>
            </div>
          ) : (
            <>
        {/* Token Context */}
              {mint && <TokenContext mint={mint} />}

        {/* Creator Identity */}
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
                hasMultipleCreators={data.creators.length > 1}
                currentIndex={currentCreatorIndex}
                totalCreators={data.creators.length}
                onPrevious={handlePreviousCreator}
              onNext={handleNextCreator}
            />

            {currentCreator.twitterData ? (
                <AccountsSection
                  twitter={currentCreator.twitterData}
                  github={{
                    username: "N/A",
                    recentCommits: "No GitHub data",
                    recentRepos: [],
                    tags: [],
                  }}
                />
              ) : (
                <div className="glass-card p-4">
                  <p className="text-sm text-muted-foreground">No Twitter data available</p>
              </div>
            )}

            {currentCreator.timelineData ? (
                <ActivitySection
                  postsData={currentCreator.timelineData.postsData}
                  engagementData={currentCreator.timelineData.engagementData}
                />
              ) : (
                <div className="glass-card p-4">
                  <p className="text-sm text-muted-foreground">No activity data available</p>
              </div>
            )}

            <NetworkSection networkData={data.network || []} />
          </>
        )}
        </div>
      </div>

      <div className="p-3 pt-2 pb-2 text-center shrink-0">
        <p className="text-[9px] text-muted-foreground/50 leading-relaxed">
          Context, not advice • Built for curious degens 🦎
        </p>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />
    </div>
  );
};

export default ExtensionPopup;
