import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Star, Shield, User, Trophy, Calendar, ExternalLink } from "lucide-react";
import { getFavoritesApi } from "../../api/favorite.api";
import { Loading } from "../../components/ui/Loading";
import { Card } from "../../components/ui/Card";
import FavoriteButton from "../../components/common/FavoriteButton";

export const Favorites = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("ALL");

  // Fetch full user favorites list from backend (cached via Redis)
  const { data: resData, isLoading, refetch } = useQuery({
    queryKey: ["user-favorites"],
    queryFn: getFavoritesApi,
    staleTime: 300000,
  });

  const favoritesList = resData?.data || [];

  const teams = favoritesList.filter((item) => item.itemType === "TEAM");
  const players = favoritesList.filter((item) => item.itemType === "PLAYER");
  const matches = favoritesList.filter((item) => item.itemType === "MATCH");
  const leagues = favoritesList.filter((item) => item.itemType === "LEAGUE");

  const categoryCounts = {
    ALL: favoritesList.length,
    TEAM: teams.length,
    PLAYER: players.length,
    MATCH: matches.length,
    LEAGUE: leagues.length,
  };

  const filteredItems =
    activeCategory === "ALL"
      ? favoritesList
      : favoritesList.filter((item) => item.itemType === activeCategory);

  const getItemRoute = (itemType, externalId) => {
    switch (itemType) {
      case "TEAM":
        return `/team/${externalId}`;
      case "PLAYER":
        return `/player/${externalId}`;
      case "MATCH":
        return `/match/${externalId}`;
      case "LEAGUE":
        return `/league/${externalId}`;
      default:
        return "#";
    }
  };

  const getCategoryIcon = (itemType) => {
    switch (itemType) {
      case "TEAM":
        return <Shield size={14} className="text-primary" />;
      case "PLAYER":
        return <User size={14} className="text-sky-400" />;
      case "MATCH":
        return <Calendar size={14} className="text-amber-400" />;
      case "LEAGUE":
        return <Trophy size={14} className="text-purple-400" />;
      default:
        return <Star size={14} className="text-amber-400" />;
    }
  };

  if (isLoading) {
    return <Loading text="Fetching your favorited dossiers from Redis cache..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border/40 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-black text-xl text-text flex items-center gap-2">
            <Star size={20} className="text-amber-400 fill-amber-400" /> Favorites Dashboard
          </h2>
          <p className="text-xs text-muted mt-1">
            Your personalized collection of bookmarked clubs, players, and match telemetry.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {["ALL", "TEAM", "PLAYER", "MATCH", "LEAGUE"].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeCategory === cat
                  ? "bg-primary text-white shadow-sm"
                  : "bg-border/30 text-muted hover:text-text hover:bg-border/60"
              }`}
            >
              {cat === "ALL" ? "All Items" : `${cat}s`} ({categoryCounts[cat] || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {favoritesList.length === 0 ? (
        <Card className="text-center py-16 text-xs text-muted border-dashed border-border space-y-3">
          <Star size={36} className="mx-auto text-amber-400/40 animate-pulse" />
          <p className="font-extrabold text-sm text-text">No favorites bookmarked yet.</p>
          <p className="max-w-md mx-auto text-muted">
            Click the ⭐ Star icon on any Team card, Player profile, or Match fixture to pin it to your personal dashboard.
          </p>
        </Card>
      ) : filteredItems.length === 0 ? (
        <Card className="text-center py-12 text-xs text-muted border-dashed border-border">
          No favorited {activeCategory.toLowerCase()}s found in your collection.
        </Card>
      ) : (
        /* Favorites Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((fav) => {
            const { _id, itemType, externalId, meta } = fav;
            const route = getItemRoute(itemType, externalId);

            return (
              <Card
                key={_id || `${itemType}-${externalId}`}
                onClick={() => navigate(route)}
                className="relative flex items-center justify-between p-4 border border-border/70 hover:border-primary/40 transition-all cursor-pointer group hover:-translate-y-0.5 shadow-sm"
              >
                <div className="flex items-center gap-3.5 min-w-0 pr-8">
                  {/* Badge Image / Fallback Icon */}
                  <div className="w-11 h-11 flex items-center justify-center bg-white/5 rounded-xl p-1.5 border border-border/50 shrink-0">
                    {meta?.badgeUrl ? (
                      <img
                        src={meta.badgeUrl}
                        alt={meta.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      getCategoryIcon(itemType)
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-muted px-1.5 py-0.5 rounded bg-border/40">
                        {itemType}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-sm text-text group-hover:text-primary transition-colors truncate mt-1">
                      {meta?.name || "Unnamed Item"}
                    </h4>
                    {meta?.subtitle && (
                      <p className="text-[11px] text-muted truncate mt-0.5">
                        {meta.subtitle}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Action: Un-favorite & Navigate */}
                <div className="flex items-center gap-1 shrink-0 z-10">
                  <FavoriteButton
                    itemType={itemType}
                    externalId={externalId}
                    iconType="star"
                    meta={meta}
                    isFavoriteInitial={true}
                    onToggleSuccess={() => refetch()}
                    size={16}
                  />
                  <ExternalLink size={14} className="text-muted group-hover:text-primary transition-colors ml-1" />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Favorites;
