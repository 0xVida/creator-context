import { Twitter, ExternalLink, Sparkles } from "lucide-react";
import PillBadge from "../PillBadge";

interface RecommendedUser {
  username: string;
  displayName: string;
  avatar?: string;
  reason: string;
  tags: string[];
}

interface NetworkSectionProps {
  networkData: RecommendedUser[];
}

const NetworkSection = ({ networkData }: NetworkSectionProps) => {
  const recommendedUsers = networkData.length > 0 ? networkData : [];
  const handlePingOnX = (username: string) => {
    const tweetText = encodeURIComponent(
      `gm @${username} 👀\nseen you shipping cool stuff — would love to see you launch something on @bagsfm`
    );
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, "_blank");
  };

  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-primary" />
        <p className="section-heading mb-0">Network</p>
      </div>
      
      <p className="text-[10px] text-muted-foreground mb-3">
        Similar builders who might launch on Bags
      </p>

      {recommendedUsers.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <p className="text-xs text-muted-foreground">No builders found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {recommendedUsers.map((user) => (
          <div key={user.username} className="bg-secondary/30 rounded-xl p-2.5 group">
            <div className="flex items-start gap-2.5">
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-[#1DA1F2]/10 flex items-center justify-center border border-[#1DA1F2]/30 shrink-0">
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="w-full h-full rounded-full" />
                ) : (
                  <Twitter className="w-4 h-4 text-[#1DA1F2]" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-foreground">{user.displayName}</span>
                    <p className="text-[10px] text-muted-foreground">@{user.username}</p>
                  </div>
                  <a
                    href={`https://twitter.com/${user.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 hover:bg-secondary rounded transition-colors"
                  >
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </a>
                </div>
                
                {/* Reason */}
                <p className="text-[9px] text-primary mt-0.5 italic">"{user.reason}"</p>

                {/* Tags */}
                <div className="flex items-center gap-1 mt-1 flex-wrap">
                  {user.tags.map((tag) => (
                    <PillBadge key={tag} variant="muted" className="text-[7px] py-0.5 px-1.5">
                      {tag}
                    </PillBadge>
                  ))}
                </div>
              </div>
            </div>

            {/* Ping Button */}
            <button
              onClick={() => handlePingOnX(user.username)}
              className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg transition-all"
            >
              <Twitter className="w-3 h-3 text-primary" />
              <span className="text-[10px] font-medium text-primary">Ping on X</span>
            </button>
          </div>
          ))}
        </div>
      )}

      <p className="text-[8px] text-muted-foreground/50 text-center mt-3">
        Discovery, not endorsement • Keep it friendly 🤝
      </p>
    </div>
  );
};

export default NetworkSection;
