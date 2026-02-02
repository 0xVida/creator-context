import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const screenname = searchParams.get("screenname");
  const restId = searchParams.get("rest_id");

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
    const url = new URL(`https://${rapidApiHost}/screenname.php`);
    url.searchParams.set("screenname", screenname);
    if (restId) {
      url.searchParams.set("rest_id", restId);
    }

    console.log("Twitter API request:", {
      screenname,
      restId,
      url: url.toString(),
    });

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "x-rapidapi-key": rapidApiKey,
        "x-rapidapi-host": rapidApiHost,
      },
    });

    console.log("Twitter API response status:", response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Twitter API error response:", errorText);
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
    
    console.log("Twitter API content-type:", contentType);
    
    if (contentType?.includes("application/json")) {
      data = await response.json();
      console.log("Twitter API JSON response:", data);
    } else {
      const text = await response.text();
      console.log("Twitter API text response (first 500 chars):", text.substring(0, 500));
      try {
        data = JSON.parse(text);
        console.log("Twitter API parsed JSON:", data);
      } catch (parseError) {
        console.error("Twitter API parse error:", parseError);
        return NextResponse.json(
          { 
            success: false, 
            error: "Failed to parse API response" 
          },
          { status: 500 }
        );
      }
    }

    console.log("Twitter API success - returning data");
    return NextResponse.json({
      success: true,
      response: data,
    });
  } catch (error) {
    console.error("Error fetching Twitter details:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to fetch Twitter details" 
      },
      { status: 500 }
    );
  }
}
