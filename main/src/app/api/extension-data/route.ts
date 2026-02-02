import { NextRequest, NextResponse } from "next/server";
import { transformTwitterData, processTimelineData, processSearchResults, type TwitterApiResponse, type TwitterTimelineResponse, type TwitterSearchResponse } from "@/lib/utils";

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

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mint = searchParams.get("mint");

  if (!mint) {
    return NextResponse.json(
      { success: false, error: "Mint parameter is required" },
      { status: 400 }
    );
  }

  try {
    const bagsApiKey = process.env.BAGS_API_KEY;
    if (!bagsApiKey) {
      return NextResponse.json(
        { success: false, error: "Bags API key not configured" },
        { status: 500 }
      );
    }

    const [creatorsResponse, claimStatsResponse] = await Promise.all([
      fetch(`https://public-api-v2.bags.fm/api/v1/token-launch/creator/v3?tokenMint=${encodeURIComponent(mint)}`, {
        headers: { "x-api-key": bagsApiKey },
      }),
      fetch(`https://public-api-v2.bags.fm/api/v1/token-launch/claim-stats?tokenMint=${encodeURIComponent(mint)}`, {
        headers: { "x-api-key": bagsApiKey },
      }),
    ]);

    if (!creatorsResponse.ok || !claimStatsResponse.ok) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch data from Bags API" },
        { status: 500 }
      );
    }

    const creatorsData = await creatorsResponse.json();
    const claimStatsData = await claimStatsResponse.json();

    if (!creatorsData.success || !claimStatsData.success) {
      return NextResponse.json(
        { success: false, error: "API returned unsuccessful response" },
        { status: 500 }
      );
    }

    const creatorsMap = new Map<string, CreatorData>(
      (creatorsData.response as CreatorData[])
        .filter((item: any) => item.royaltyBps !== 0)
        .map((creator: CreatorData) => [creator.wallet, creator])
    );

    (claimStatsData.response as Array<CreatorData & { totalClaimed: string }>)
      .filter((item: any) => item.royaltyBps !== 0)
      .forEach((claimStat) => {
        const existing = creatorsMap.get(claimStat.wallet);
        if (existing) {
          existing.totalClaimed = claimStat.totalClaimed;
          if (!existing.providerUsername && claimStat.providerUsername) {
            existing.providerUsername = claimStat.providerUsername;
          }
          if (claimStat.provider === "twitter" && claimStat.providerUsername) {
            existing.twitterUsername = claimStat.providerUsername;
          }
        } else {
          const newCreator: CreatorData = {
            ...claimStat,
            bagsUsername: undefined,
            twitterUsername: claimStat.provider === "twitter" ? claimStat.providerUsername || null : undefined,
          };
          creatorsMap.set(claimStat.wallet, newCreator);
        }
      });

    const mergedCreators = Array.from(creatorsMap.values());

    const rapidApiKey = process.env.RAPIDAPI_KEY;
    const rapidApiHost = process.env.RAPIDAPI_HOST;

    const creatorsWithTwitterData = await Promise.all(
      mergedCreators.map(async (creator) => {
        const twitterUsername = creator.twitterUsername || creator.providerUsername;
        
        if (!twitterUsername || !rapidApiKey || !rapidApiHost) {
          return {
            ...creator,
            twitterData: null,
            timelineData: null,
          };
        }

        try {
          const twitterUrl = new URL(`https://${rapidApiHost}/screenname.php`);
          twitterUrl.searchParams.set("screenname", twitterUsername);

          const twitterResponse = await fetch(twitterUrl.toString(), {
            headers: {
              "x-rapidapi-key": rapidApiKey,
              "x-rapidapi-host": rapidApiHost,
            },
          });

          let twitterDetails: TwitterApiResponse | null = null;
          if (twitterResponse.ok) {
            const contentType = twitterResponse.headers.get("content-type");
            if (contentType?.includes("application/json")) {
              const data = await twitterResponse.json();
              twitterDetails = data;
            } else {
              const text = await twitterResponse.text();
              try {
                twitterDetails = JSON.parse(text);
              } catch {
              }
            }
          }

          let timelineData = null;
          if (twitterDetails) {
            const timelineUrl = new URL(`https://${rapidApiHost}/timeline.php`);
            timelineUrl.searchParams.set("screenname", twitterUsername);

            const timelineResponse = await fetch(timelineUrl.toString(), {
              headers: {
                "x-rapidapi-key": rapidApiKey,
                "x-rapidapi-host": rapidApiHost,
              },
            });

            if (timelineResponse.ok) {
              const contentType = timelineResponse.headers.get("content-type");
              if (contentType?.includes("application/json")) {
                const data = await timelineResponse.json();
                timelineData = processTimelineData(data as TwitterTimelineResponse);
              } else {
                const text = await timelineResponse.text();
                try {
                  const data = JSON.parse(text);
                  timelineData = processTimelineData(data as TwitterTimelineResponse);
                } catch {
                }
              }
            }
          }

          const transformedTwitter = twitterDetails
            ? transformTwitterData(twitterDetails, twitterUsername, creator.pfp)
            : null;

          return {
            ...creator,
            twitterData: transformedTwitter,
            timelineData,
          };
        } catch (error) {
          console.error(`Error fetching Twitter data for ${twitterUsername}:`, error);
          return {
            ...creator,
            twitterData: null,
            timelineData: null,
          };
        }
      })
    );

    let networkData: Array<{
      username: string;
      displayName: string;
      avatar?: string;
      reason: string;
      tags: string[];
    }> = [];

    if (rapidApiKey && rapidApiHost) {
      try {
        const searchUrl = new URL(`https://${rapidApiHost}/search.php`);
        searchUrl.searchParams.set("query", "solana build");
        searchUrl.searchParams.set("search_type", "Top");

        const searchResponse = await fetch(searchUrl.toString(), {
          headers: {
            "x-rapidapi-key": rapidApiKey,
            "x-rapidapi-host": rapidApiHost,
          },
        });

        if (searchResponse.ok) {
          const contentType = searchResponse.headers.get("content-type");
          let searchData: TwitterSearchResponse | null = null;
          
          if (contentType?.includes("application/json")) {
            searchData = await searchResponse.json();
          } else {
            const text = await searchResponse.text();
              try {
                searchData = JSON.parse(text);
              } catch {
              }
            }

            if (searchData && searchData.timeline) {
              networkData = processSearchResults(searchData);
            }
          }
        } catch (error) {
          console.error("Error fetching network data:", error);
        }
      }

    return NextResponse.json(
      {
        success: true,
        data: {
          mint,
          creators: creatorsWithTwitterData,
          network: networkData,
        },
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  } catch (error) {
    console.error("Error in extension-data route:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch extension data",
      },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
