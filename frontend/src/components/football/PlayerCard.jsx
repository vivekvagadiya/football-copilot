import React from "react";
import { useNavigate } from "react-router-dom";
import { Star, Target, Shield } from "lucide-react";
import { Card } from "../ui/Card";
import { Avatar } from "../ui/Avatar";
import { useApp } from "../../context/AppContext";

export const PlayerCard = ({ player }) => {
  const navigate = useNavigate();
  const { toggleFavorite, isFavorite } = useApp();

  const {
    id,
    rank,
    name,
    photo,
    flag,
    teamName,
    teamCrest,
    position,
    number,
    nationality,
    goals,
    assists,
    playedMatches,
    penalties,
    value,
    stats = {},
  } = player || {};

  const crestUrl = teamCrest || flag;
  const playerGoals = goals ?? stats.goals ?? 0;
  const playerAssists = assists ?? stats.assists ?? 0;
  const playerMatches = playedMatches ?? stats.playedMatches ?? 0;
  const playerPenalties = penalties ?? stats.penalties ?? 0;
  const playerRating =
    typeof stats.rating === "number"
      ? stats.rating.toFixed(1)
      : stats.rating || "7.5";

  const isFavorited = isFavorite("players", id);

  const handleCardClick = () => {
    navigate(
      `/player/${id}`,
      // { state: { player } }
    );
  };

  const getRankBadge = (r) => {
    if (r === 1)
      return {
        bg: "bg-amber-500/15 text-amber-400 border-amber-500/30",
        label: "👑 #1",
      };
    if (r === 2)
      return {
        bg: "bg-slate-400/15 text-slate-300 border-slate-400/30",
        label: "🥈 #2",
      };
    if (r === 3)
      return {
        bg: "bg-amber-700/15 text-amber-600 border-amber-700/30",
        label: "🥉 #3",
      };
    if (r)
      return {
        bg: "bg-border/40 text-muted border-border/40",
        label: `#${r}`,
      };
    return null;
  };

  const rankBadge = getRankBadge(rank || number);

  return (
    <Card
      onClick={handleCardClick}
      className="relative flex flex-col justify-between overflow-hidden border border-border hover:border-primary/40 transition-all p-4 group cursor-pointer"
    >
      {/* Header Bar: Rank Badge & Favorite Button */}
      <div className="flex items-center justify-between mb-3">
        {rankBadge ? (
          <span
            className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${rankBadge.bg}`}
          >
            {rankBadge.label}
          </span>
        ) : (
          <div />
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite("players", id);
          }}
          className={`p-1.5 rounded-full hover:bg-border/30 transition-colors ${
            isFavorited ? "text-primary" : "text-muted hover:text-text"
          }`}
        >
          <Star size={14} className={isFavorited ? "fill-current" : ""} />
        </button>
      </div>

      {/* Profile Header: Avatar & Player Details */}
      <div className="flex items-start gap-3.5 mb-3.5">
        <Avatar
          src={photo}
          fallback={name?.[0] || "⚽"}
          size="lg"
          className="shrink-0 group-hover:scale-105 transition-transform border border-border/50"
        />

        <div className="min-w-0 flex-1 space-y-1">
          {/* Team Crest & Name Row */}
          <div className="flex items-center gap-1.5 text-xs">
            {crestUrl &&
            typeof crestUrl === "string" &&
            (crestUrl.startsWith("http") || crestUrl.startsWith("/")) ? (
              <img
                src={crestUrl}
                alt={teamName}
                className="w-4 h-4 object-contain shrink-0"
              />
            ) : (
              <Shield size={13} className="text-primary shrink-0" />
            )}
            <span className="font-bold text-text/90 truncate">
              {teamName || "Free Agent"}
            </span>
          </div>

          <h4 className="font-display font-black text-text group-hover:text-primary transition-colors truncate text-sm">
            {name}
          </h4>

          <div className="flex items-center gap-2 text-[10px] text-muted">
            <span className="font-semibold px-1.5 py-0.2 rounded bg-primary/10 text-primary">
              {position || "Player"}
            </span>
            {nationality && <span className="truncate">• {nationality}</span>}
          </div>
        </div>
      </div>

      {/* Stats Mini Grid */}
      <div className="grid grid-cols-4 gap-1.5 bg-background/60 p-2.5 rounded-xl border border-border/40 mb-3 text-center text-[10px]">
        <div>
          <span className="block text-muted text-[9px] uppercase font-semibold">
            Goals
          </span>
          <span className="font-display font-extrabold text-primary text-xs">
            {playerGoals}
          </span>
        </div>
        <div>
          <span className="block text-muted text-[9px] uppercase font-semibold">
            Assists
          </span>
          <span className="font-display font-bold text-text text-xs">
            {playerAssists}
          </span>
        </div>
        <div>
          <span className="block text-muted text-[9px] uppercase font-semibold">
            Matches
          </span>
          <span className="font-display font-bold text-text text-xs">
            {playerMatches}
          </span>
        </div>
        <div>
          <span className="block text-muted text-[9px] uppercase font-semibold">
            Rating
          </span>
          <span className="font-display font-bold text-emerald-400 text-xs">
            {playerRating}
          </span>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between border-t border-border/40 pt-2 text-[10px] text-muted">
        <span className="flex items-center gap-1 font-medium">
          <Target size={11} className="text-primary" />
          {playerPenalties > 0
            ? `${playerPenalties} Penalties`
            : `${playerMatches} Apps`}
        </span>
        <span className="font-extrabold text-text">
          {value || `${playerGoals} Goals`}
        </span>
      </div>
    </Card>
  );
};

export default PlayerCard;
