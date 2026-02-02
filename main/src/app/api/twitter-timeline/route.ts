import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const screenname = searchParams.get("screenname");

  if (!screenname) {
    return NextResponse.json(
      { success: false, error: "screenname parameter is required" },
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
    const url = new URL(`https://${rapidApiHost}/timeline.php`);
    url.searchParams.set("screenname", screenname);

    console.log("Twitter Timeline API request:", {
      screenname,
      url: url.toString(),
    });

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "x-rapidapi-key": rapidApiKey,
        "x-rapidapi-host": rapidApiHost,
      },
    });

    console.log("Twitter Timeline API response status:", response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Twitter Timeline API error response:", errorText);
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
    
    console.log("Twitter Timeline API content-type:", contentType);
    
    if (contentType?.includes("application/json")) {
      data = await response.json();
      console.log("Twitter Timeline API JSON response received");
    } else {
      const text = await response.text();
      console.log("Twitter Timeline API text response (first 500 chars):", text.substring(0, 500));
      try {
        data = JSON.parse(text);
        console.log("Twitter Timeline API parsed JSON");
      } catch (parseError) {
        console.error("Twitter Timeline API parse error:", parseError);
        return NextResponse.json(
          { 
            success: false, 
            error: "Failed to parse API response" 
          },
          { status: 500 }
        );
      }
    }

    console.log("Twitter Timeline API success - returning data");
    return NextResponse.json({
      success: true,
      response: data,
    });
  } catch (error) {
    console.error("Error fetching Twitter timeline:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to fetch Twitter timeline" 
      },
      { status: 500 }
    );
  }
}
