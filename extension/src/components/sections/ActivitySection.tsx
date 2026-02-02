import { MessageSquare, Heart } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { XAxis, YAxis, Area, AreaChart, Line, LineChart } from "recharts";

const chartConfig = {
  posts: { label: "Posts", color: "hsl(155 100% 50%)" },
  likes: { label: "Likes", color: "hsl(155 100% 50%)" },
  replies: { label: "Replies", color: "hsl(155 70% 40%)" },
};

interface ActivitySectionProps {
  postsData: Array<{ day: string; posts: number }>;
  engagementData: Array<{ day: string; likes: number; replies: number }>;
}

const ActivitySection = ({ postsData, engagementData }: ActivitySectionProps) => {
  return (
    <div className="glass-card p-4">
      <p className="section-heading">Activity</p>

      <div className="space-y-3">
        {/* Posts Over Time */}
        <div className="bg-secondary/30 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Posts</span>
            </div>
            <span className="text-[8px] text-muted-foreground">7 days</span>
          </div>

          <ChartContainer config={chartConfig} className="h-[80px] w-full">
            <AreaChart data={postsData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="postsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(155 100% 50%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(155 100% 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 8, fill: 'hsl(155 20% 50%)' }}
              />
              <YAxis hide />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="posts"
                stroke="hsl(155 100% 50%)"
                strokeWidth={2}
                fill="url(#postsGradient)"
              />
            </AreaChart>
          </ChartContainer>
        </div>

        {/* Engagement Trend */}
        <div className="bg-secondary/30 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Engagement</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span className="text-[7px] text-muted-foreground">Likes</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                <span className="text-[7px] text-muted-foreground">Replies</span>
              </div>
            </div>
          </div>

          <ChartContainer config={chartConfig} className="h-[80px] w-full">
            <LineChart data={engagementData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false}
                tick={{ fontSize: 8, fill: 'hsl(155 20% 50%)' }}
              />
              <YAxis hide />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="likes"
                stroke="hsl(155 100% 50%)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="replies"
                stroke="hsl(155 70% 40%)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </div>

      </div>

      <p className="text-[8px] text-muted-foreground/50 text-center mt-3">
        Zoomed for vibes, not precision
      </p>
    </div>
  );
};

export default ActivitySection;
