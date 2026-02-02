import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query");
  const searchType = searchParams.get("search_type") || "Top";

  if (!query) {
    return NextResponse.json(
      { success: false, error: "query parameter is required" },
      { status: 400 }
    );
  }

  const rapidApiKey = process.env.RAPIDAPI_KEY;
  const rapidApiHost = process.env.RAPIDAPI_HOST;

  if (!rapidApiKey || !rapidApiHost) {
    return NextResponse.json(
      { success: false, error: "RapidAPI credentials not configured" },
      { status: 500 }
    );
  }

  try {
    const url = new URL(`https://${rapidApiHost}/search.php`);
    url.searchParams.set("query", query);
    url.searchParams.set("search_type", searchType);

    console.log("Twitter Search API request:", {
      query,
      searchType,
      url: url.toString(),
    });

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "x-rapidapi-key": rapidApiKey,
        "x-rapidapi-host": rapidApiHost,
      },
    });

    console.log("Twitter Search API response status:", response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Twitter Search API error response:", errorText);
      return NextResponse.json(
        { 
          success: false, 
          error: `API returned ${response.status}: ${errorText}` 
        },
        { status: response.status }
      );
    }

    let data;
    const contentType = response.headers.get("content-type");
    
    console.log("Twitter Search API content-type:", contentType);
    
    if (contentType?.includes("application/json")) {
      data = await response.json();
      console.log("Twitter Search API JSON response received");
    } else {
      const text = await response.text();
      console.log("Twitter Search API text response (first 500 chars):", text.substring(0, 500));
      try {
        data = JSON.parse(text);
        console.log("Twitter Search API parsed JSON");
      } catch (parseError) {
        console.error("Twitter Search API parse error:", parseError);
        return NextResponse.json(
          { 
            success: false, 
            error: "Failed to parse API response" 
          },
          { status: 500 }
        );
      }
    }

    console.log("Twitter Search API success - returning data");
    return NextResponse.json({
      success: true,
      response: data,
    });
  } catch (error) {
    console.error("Error fetching Twitter search:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to fetch Twitter search results" 
      },
      { status: 500 }
    );
  }
}
