import { Zap } from "lucide-react";

interface ActivitySummaryProps {
  summary: string;
}

const ActivitySummary = ({ summary }: ActivitySummaryProps) => {
  return (
    <div className="glass-card p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
      
      <div className="flex items-start gap-3 relative z-10">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 pulse-glow flex-shrink-0">
          <Zap className="w-4 h-4 text-primary" />
        </div>
        
        <div>
          <p className="section-heading mb-2">Activity Summary</p>
          <p className="text-sm text-foreground leading-relaxed">{summary}</p>
        </div>
      </div>
    </div>
  );
};

export default ActivitySummary;
