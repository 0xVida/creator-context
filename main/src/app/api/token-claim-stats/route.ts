import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mint = searchParams.get("mint");

  if (!mint) {
    return NextResponse.json(
      { success: false, error: "Mint parameter is required" },
      { status: 400 }
    );
  }

  const bagsApiKey = process.env.BAGS_API_KEY;

  if (!bagsApiKey) {
    return NextResponse.json(
      { success: false, error: "Bags API key not configured" },
      { status: 500 }
    );
  }

  try {
    const url = new URL("https://public-api-v2.bags.fm/api/v1/token-launch/claim-stats");
    url.searchParams.set("tokenMint", mint);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "x-api-key": bagsApiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { 
          success: false, 
          error: `API returned ${response.status}: ${errorText}` 
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!data.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: data.error || "API returned unsuccessful response" 
        },
        { status: 500 }
      );
    }

    if (!Array.isArray(data.response)) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid response format from API" 
        },
        { status: 500 }
      );
    }

    const royaltyClaimers = data.response.filter(
      (item: any) => item.royaltyBps !== 0
    );

    return NextResponse.json({
      success: true,
      response: royaltyClaimers,
    });
  } catch (error) {
    console.error("Error fetching token claim stats:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to fetch token claim stats" 
      },
      { status: 500 }
    );
  }
}
