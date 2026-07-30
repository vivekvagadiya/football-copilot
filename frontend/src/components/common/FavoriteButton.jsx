import React, { useState, useEffect } from "react";
import { Heart, Star } from "lucide-react";
import { toast } from "sonner";
import { toggleFavoriteApi } from "../../api/favorite.api";
import { useApp } from "../../context/AppContext";

export default function FavoriteButton({
  itemType,
  externalId,
  meta,
  isFavoriteInitial = false,
  onToggleSuccess,
  className = "",
  size = 20,
  iconType = "star",
}) {
  const [isFavorite, setIsFavorite] = useState(isFavoriteInitial);
  const [loading, setLoading] = useState(false);
  const { toggleFavorite } = useApp();

  useEffect(() => {
    setIsFavorite(isFavoriteInitial);
  }, [isFavoriteInitial]);

  const IconComponent = iconType === "star" ? Star : Heart;

  const handleToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (loading) return;

    // Optimistic UI update
    const nextState = !isFavorite;
    setIsFavorite(nextState);
    setLoading(true);

    try {
      const res = await toggleFavoriteApi({
        itemType,
        externalId,
        meta,
      });

      if (res.success) {
        setIsFavorite(res.data.isFavorite);
        toggleFavorite(itemType, externalId);
        toast.success(
          res.message ||
            (res.data.isFavorite
              ? "Added to favorites"
              : "Removed from favorites"),
        );
        if (onToggleSuccess) {
          onToggleSuccess(res.data.isFavorite, res.data.favorite);
        }
      } else {
        // Revert on failure
        setIsFavorite(!nextState);
        toast.error("Failed to update favorite status");
      }
    } catch (error) {
      // Revert on failure
      setIsFavorite(!nextState);
      toast.error(error.response?.data?.message || "Error updating favorite");
    } finally {
      setLoading(false);
    }
  };

  const isStar = iconType === "star";
  const activeColorClass = isStar
    ? "text-amber-400 hover:bg-amber-400/20"
    : "text-red-500 hover:bg-red-500/20";
  const activeFillClass = isStar
    ? "fill-amber-400 scale-110"
    : "fill-red-500 scale-110";

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
      className={`p-1.5 rounded-full transition-all duration-200 focus:outline-none cursor-pointer ${
        isFavorite
          ? `bg-amber-400/10 ${activeColorClass}`
          : " text-gray-400 hover:text-amber-400 hover:bg-amber-400/10"
      } ${className}`}
    >
      <IconComponent
        size={size}
        className={`transition-transform duration-200 ${
          isFavorite ? activeFillClass : "scale-100"
        } ${loading ? "animate-pulse" : ""}`}
      />
    </button>
  );
}
