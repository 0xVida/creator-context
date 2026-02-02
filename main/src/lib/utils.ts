import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function lamportsToSol(lamports: string | number): string {
  const LAMPORTS_PER_SOL = 1_000_000_000;
  const lamportsNum = typeof lamports === "string" ? parseFloat(lamports) : lamports;
  const sol = lamportsNum / LAMPORTS_PER_SOL;
  
  const formatted = sol.toFixed(2);
  const cleaned = formatted.replace(/\.?0+$/, "");
  return `${cleaned} SOL`;
}


export interface TwitterApiResponse {
  status?: string;
  profile?: string;
  rest_id?: string;
  blue_verified?: boolean | null;
  avatar?: string;
  header_image?: string;
  desc?: string;
  name?: string;
  protected?: boolean;
  location?: string;
  friends?: number;
  sub_count?: number;
  statuses_count?: number;
  media_count?: number;
  created_at?: string;
  id?: string;
}

export function transformTwitterData(
  apiData: TwitterApiResponse,
  fallbackUsername?: string,
  existingAvatar?: string
): {
  username: string;
  displayName: string;
  avatar?: string;
  followers: number;
  following: number;
  accountAge: string;
  bio: string;
  location?: string;
  lastActive: string;
  postsPerWeek: number;
  mediaCount: number;
  isVerified: boolean;
  isProtected: boolean;
  status?: string;
  restId?: string;
  twitterId?: string;
  activity: "very-active" | "active" | "quiet";
} {
  const formatAccountAge = (createdAt?: string): string => {
    if (!createdAt) return "Unknown";
    try {
      const date = new Date(createdAt);
      const year = date.getFullYear();
      return `Since ${year}`;
    } catch {
      return "Unknown";
    }
  };

  const calculatePostsPerWeek = (statusesCount?: number, createdAt?: string): number => {
    if (!statusesCount) return 0;
    if (!createdAt) return Math.round(statusesCount / 100);
    
    try {
      const accountStart = new Date(createdAt);
      const now = new Date();
      const weeksSinceStart = (now.getTime() - accountStart.getTime()) / (1000 * 60 * 60 * 24 * 7);
      
      if (weeksSinceStart < 1) return statusesCount;
      return Math.round(statusesCount / weeksSinceStart);
    } catch {
      return Math.round(statusesCount / 100);
    }
  };

  const determineActivity = (postsPerWeek: number): "very-active" | "active" | "quiet" => {
    if (postsPerWeek >= 20) return "very-active";
    if (postsPerWeek >= 5) return "active";
    return "quiet";
  };

  const postsPerWeek = calculatePostsPerWeek(apiData.statuses_count, apiData.created_at);
  const activity = determineActivity(postsPerWeek);

  return {
    username: apiData.profile || fallbackUsername || "unknown",
    displayName: apiData.name || apiData.profile || fallbackUsername || "Unknown",
    avatar: existingAvatar || apiData.avatar,
    followers: apiData.sub_count || 0,
    following: apiData.friends || 0,
    accountAge: formatAccountAge(apiData.created_at),
    bio: apiData.desc || "No bio available",
    location: apiData.location,
    lastActive: "Recently",
    postsPerWeek,
    mediaCount: apiData.media_count || 0,
    isVerified: apiData.blue_verified === true,
    isProtected: apiData.protected === true,
    status: apiData.status,
    restId: apiData.rest_id,
    twitterId: apiData.id,
    activity,
  };
}

export interface TwitterTimelineTweet {
  tweet_id: string;
  created_at: string;
  favorites: number;
  replies: number;
  retweets: number;
  quotes?: number;
  views?: string | number;
}

export interface TwitterTimelineResponse {
  pinned?: TwitterTimelineTweet;
  timeline: TwitterTimelineTweet[];
  user?: any;
}


export function processTimelineData(timelineResponse: TwitterTimelineResponse): {
  postsData: Array<{ day: string; posts: number }>;
  engagementData: Array<{ day: string; likes: number; replies: number }>;
} {
  const allTweets: TwitterTimelineTweet[] = [];
  if (timelineResponse.pinned) {
    allTweets.push(timelineResponse.pinned);
  }
  if (timelineResponse.timeline) {
    allTweets.push(...timelineResponse.timeline);
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const postsByDay: Record<string, number> = {};
  const likesByDay: Record<string, number> = {};
  const repliesByDay: Record<string, number> = {};

  for (let i = 0; i < 7; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dayKey = dayNames[date.getDay()];
    postsByDay[dayKey] = 0;
    likesByDay[dayKey] = 0;
    repliesByDay[dayKey] = 0;
  }

  allTweets.forEach((tweet) => {
    try {
      const tweetDate = new Date(tweet.created_at);
      
      if (tweetDate >= sevenDaysAgo && tweetDate <= now) {
        const dayKey = dayNames[tweetDate.getDay()];
        
        postsByDay[dayKey] = (postsByDay[dayKey] || 0) + 1;
        
        likesByDay[dayKey] = (likesByDay[dayKey] || 0) + (tweet.favorites || 0);
        repliesByDay[dayKey] = (repliesByDay[dayKey] || 0) + (tweet.replies || 0);
      }
    } catch (error) {
      console.error("Error processing tweet date:", error);
    }
  });

  const postsData: Array<{ day: string; posts: number }> = [];
  const engagementData: Array<{ day: string; likes: number; replies: number }> = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dayKey = dayNames[date.getDay()];
    
    postsData.push({
      day: dayKey,
      posts: postsByDay[dayKey] || 0,
    });
    
    engagementData.push({
      day: dayKey,
      likes: likesByDay[dayKey] || 0,
      replies: repliesByDay[dayKey] || 0,
    });
  }

  return { postsData, engagementData };
}

export interface TwitterSearchTweet {
  type: string;
  tweet_id: string;
  screen_name: string;
  created_at: string;
  text: string;
  favorites: number;
  replies: number;
  retweets: number;
  quotes?: number;
  views?: string | number;
  user_info: {
    screen_name: string;
    name: string;
    avatar: string;
    description?: string;
    followers_count?: number;
    verified?: boolean;
    location?: string;
  };
}

export interface TwitterSearchResponse {
  status: string;
  timeline: TwitterSearchTweet[];
  next_cursor?: string;
  prev_cursor?: string;
}

export function processSearchResults(searchResponse: TwitterSearchResponse): Array<{
  username: string;
  displayName: string;
  avatar?: string;
  reason: string;
  tags: string[];
}> {
  const userMap = new Map<string, {
    username: string;
    displayName: string;
    avatar?: string;
    tweets: TwitterSearchTweet[];
    followers?: number;
    description?: string;
  }>();

  searchResponse.timeline?.forEach((tweet) => {
    if (!tweet.user_info) return;

    const screenName = tweet.user_info.screen_name;
    if (!userMap.has(screenName)) {
      userMap.set(screenName, {
        username: screenName,
        displayName: tweet.user_info.name || screenName,
        avatar: tweet.user_info.avatar,
        tweets: [tweet],
        followers: tweet.user_info.followers_count,
        description: tweet.user_info.description,
      });
    } else {
      const existing = userMap.get(screenName)!;
      existing.tweets.push(tweet);
    }
  });

  const recommendedUsers = Array.from(userMap.values())
    .slice(0, 5)
    .map((user) => {
      const tags: string[] = [];
      const text = `${user.description || ""} ${user.tweets.map(t => t.text).join(" ")}`.toLowerCase();
      
      if (text.includes("builder") || text.includes("build")) tags.push("Builder");
      if (text.includes("solana") || text.includes("sol")) tags.push("Solana");
      if (text.includes("developer") || text.includes("dev")) tags.push("Developer");
      if (text.includes("crypto") || text.includes("web3")) tags.push("Crypto-native");
      if (text.includes("ship") || text.includes("shipping")) tags.push("Shipper");
      if (text.includes("contract") || text.includes("smart contract")) tags.push("Contracts");
      if (text.includes("oss") || text.includes("open source")) tags.push("OSS");
      if (text.includes("community")) tags.push("Community");
      
      if (tags.length === 0) {
        tags.push("Builder", "Solana");
      }

      const reason = user.tweets[0]?.text?.substring(0, 50) + "..." || 
                    user.description?.substring(0, 50) + "..." || 
                    "Active Solana builder";

      return {
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        reason: reason.length > 60 ? reason.substring(0, 57) + "..." : reason,
        tags: tags.slice(0, 3),
      };
    });

  return recommendedUsers;
}
