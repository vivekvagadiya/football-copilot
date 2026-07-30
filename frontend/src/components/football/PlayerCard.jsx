import React from "react";
import { useNavigate } from "react-router-dom";
import { Star, Shield, ArrowRight } from "lucide-react";

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
    nationality,
    position,
    goals,
    assists,
    playedMatches,
    penalties,
    value,
    stats = {},
  } = player || {};

  const crest = teamCrest || flag;
  const playerGoals = goals ?? stats.goals ?? 0;
  const playerAssists = assists ?? stats.assists ?? 0;
  const matches = playedMatches ?? stats.playedMatches ?? 0;
  const pens = penalties ?? stats.penalties ?? 0;

  const rating =
    typeof stats.rating === "number"
      ? stats.rating.toFixed(1)
      : stats.rating || "7.5";

  const favorite = isFavorite("players", id);
  const openPlayer = () => navigate(`/player/${id}`);

  return (
    <Card
      onClick={openPlayer}
      className="
      relative
      overflow-hidden
      cursor-pointer
      rounded-2xl
      border
      border-border
      bg-gradient-to-b
      from-card
      via-card
      to-background
      p-4
      transition-all
      duration-300
      hover:-translate-y-1
      hover:border-primary/40
      hover:shadow-xl
      group
      "
    >
      {/* Glow */}
      <div className="absolute -top-12 right-0 h-28 w-28 rounded-full bg-primary/10 blur-2xl group-hover:bg-primary/20 transition-all" />

      {/* Top Bar: Rank & Favorite */}
      <div className="flex items-center justify-between mb-2">
        {rank ? (
          <span className="rounded-full bg-primary/90 px-2.5 py-0.5 text-[10px] font-extrabold text-white shadow-xs">
            #{rank}
          </span>
        ) : (
          <div />
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite("players", id);
          }}
          className="rounded-full bg-card/80 p-1.5 backdrop-blur hover:scale-110 transition z-10"
        >
          <Star
            size={14}
            className={
              favorite ? "fill-yellow-400 text-yellow-400" : "text-muted"
            }
          />
        </button>
      </div>

      {/* Player Header: Avatar + Info */}
      <div className="flex items-center gap-3 mb-3">
        <Avatar
          src={photo}
          fallback={name?.[0]}
          size="lg"
          className="shrink-0 border-2 border-primary/20 shadow-md group-hover:scale-105 transition"
        />

        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="font-black text-sm text-text truncate group-hover:text-primary transition-colors">
            {name}
          </h3>

          {/* Club Info */}
          <div className="flex items-center gap-1.5 text-xs">
            {crest ? (
              <img
                src={crest}
                alt={teamName}
                className="w-4 h-4 object-contain shrink-0"
              />
            ) : (
              <Shield size={13} className="text-primary shrink-0" />
            )}
            <span className="text-muted truncate text-[11px] font-medium">
              {teamName || "Free Agent"}
            </span>
          </div>

          {/* Position & Rating Pills */}
          <div className="flex items-center gap-1.5 pt-0.5">
            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
              {position || "Player"}
            </span>
            {nationality && (
              <span className="rounded-md bg-border/40 px-2 py-0.5 text-[10px] text-muted truncate">
                {nationality}
              </span>
            )}
            <span className="ml-auto text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
              ⭐ {rating}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid (4 columns single compact row) */}
      <div className="grid grid-cols-4 gap-1 bg-background/60 p-2 rounded-xl border border-border/40 mb-3 text-center">
        <Stat title="Goals" value={playerGoals} color="text-emerald-400" />
        <Stat title="Assists" value={playerAssists} color="text-sky-400" />
        <Stat title="Matches" value={matches} color="text-purple-400" />
        <Stat title="Pens" value={pens} color="text-amber-400" />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border/50 pt-2 text-xs">
        <div>
          <span className="text-[9px] text-muted block uppercase font-semibold">
            Market Value
          </span>
          <span className="font-bold text-xs text-text">{value || "—"}</span>
        </div>

        <div className="flex items-center gap-1 text-xs text-primary font-bold group-hover:translate-x-1 transition">
          View
          <ArrowRight size={13} />
        </div>
      </div>
    </Card>
  );
};

function Stat({ title, value, color }) {
  return (
    <div className="py-0.5">
      <p className="text-[9px] uppercase tracking-wider text-muted font-semibold">
        {title}
      </p>
      <h4 className={`text-xs font-black ${color}`}>{value}</h4>
    </div>
  );
}

export default PlayerCard;
