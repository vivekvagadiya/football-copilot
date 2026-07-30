import React from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Star, MapPin, Users, Globe, Trophy } from "lucide-react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { useApp } from "../../context/AppContext";

export const TeamCard = ({ team }) => {
  const navigate = useNavigate();
  const { toggleFavorite, isFavorite } = useApp();

  const {
    id,
    name,
    shortName,
    tla,
    crest,
    logo,
    venue,
    stadium,
    coach,
    manager,
    founded,
    clubColors,
    website,
    squad,
    area,
    runningCompetitions,
    rank,
    points,
    form,
  } = team || {};
  console.log("teams", team);

  const teamCrest = crest || logo;
  const managerName =
    coach?.name ||
    (coach?.firstName ? `${coach.firstName} ${coach.lastName}` : null) ||
    manager ||
    "N/A";
  const venueName = venue || stadium || "N/A";
  const squadSize = Array.isArray(squad) ? squad.length : 0;
  const isFavorited = isFavorite("teams", id);

  const handleCardClick = () => {
    navigate(`/team/${id}`, { state: { team } });
  };

  return (
    <Card
      onClick={handleCardClick}
      className="relative flex flex-col justify-between overflow-hidden border border-border hover:border-primary/40 transition-all p-4 group cursor-pointer"
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleFavorite("teams", id);
        }}
        className={`absolute top-3 right-3 p-1.5 rounded-full hover:bg-border/30 z-10 transition-colors ${
          isFavorited ? "text-primary" : "text-muted hover:text-text"
        }`}
      >
        <Star size={14} className={isFavorited ? "fill-current" : ""} />
      </button>

      <div>
        {/* Header: Crest & Club Name */}
        <div className="flex items-start gap-3.5 mb-3 pr-6">
          <div className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-lg p-1 border border-border/40 shrink-0">
            {typeof teamCrest === "string" &&
            (teamCrest.startsWith("http") || teamCrest.startsWith("/")) ? (
              <img
                src={teamCrest}
                alt={name}
                className="w-full h-full object-contain"
              />
            ) : (
              <span className="text-2xl leading-none">{teamCrest || "🛡️"}</span>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="font-display font-bold text-text group-hover:text-primary transition-colors truncate text-sm">
                {name}
              </h4>
              {tla && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase shrink-0">
                  {tla}
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted truncate mt-0.5">
              Manager: {managerName}
            </p>
          </div>
        </div>

        {/* Club Meta Info */}
        <div className="space-y-1.5 text-[11px] text-muted mb-3">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin size={12} className="text-primary/70 shrink-0" />
            <span className="truncate">{venueName}</span>
          </div>

          {(founded || clubColors) && (
            <div className="flex items-center justify-between text-[10px] pt-1">
              {founded && (
                <span>
                  Est.{" "}
                  <strong className="text-text font-semibold">{founded}</strong>
                </span>
              )}
              {clubColors && (
                <span className="truncate max-w-[140px] text-right text-text/80">
                  {clubColors}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Badges / Competitions */}
        {runningCompetitions && runningCompetitions.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap mb-3">
            {runningCompetitions.slice(0, 3).map((comp) => (
              <span
                key={comp.id}
                title={comp.name}
                className="inline-flex items-center gap-1 text-[9px] bg-border/40 text-text/80 px-2 py-0.5 rounded-full"
              >
                {comp.emblem && (
                  <img
                    src={comp.emblem}
                    alt=""
                    className="w-3 h-3 object-contain"
                  />
                )}
                <span className="truncate max-w-[80px]">{comp.name}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer Stats / Form */}
      <div className="flex justify-between items-center text-[10px] border-t border-border/40 pt-2.5 mt-auto">
        <div className="flex items-center gap-3">
          {rank !== undefined ? (
            <div>
              <span className="text-muted block">Rank</span>
              <span className="font-semibold text-text">#{rank}</span>
            </div>
          ) : squadSize > 0 ? (
            <div className="flex items-center gap-1 text-muted">
              <Users size={12} className="text-primary/70" />
              <span>
                <strong className="text-text">{squadSize}</strong> Players
              </span>
            </div>
          ) : (
            area?.name && (
              <div className="flex items-center gap-1 text-muted">
                {area.flag && (
                  <img
                    src={area.flag}
                    alt=""
                    className="w-3 h-2.5 object-cover rounded-xs"
                  />
                )}
                <span>{area.name}</span>
              </div>
            )
          )}

          {points !== undefined && (
            <div>
              <span className="text-muted block">Points</span>
              <span className="font-semibold text-text">{points} pts</span>
            </div>
          )}
        </div>

        {/* Recent Form bubbles */}
        {form && Array.isArray(form) && form.length > 0 && (
          <div className="flex items-center gap-1">
            {form.map((letter, idx) => (
              <span
                key={idx}
                className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-[8px] text-white ${
                  letter === "W"
                    ? "bg-green-500"
                    : letter === "D"
                      ? "bg-yellow-500"
                      : "bg-red-500"
                }`}
              >
                {letter}
              </span>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};
