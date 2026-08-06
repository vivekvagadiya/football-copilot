import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Cpu } from "lucide-react";
import { TRANSFERS } from "../../constants/mockData";
import { Loading } from "../../components/ui/Loading";
import { Drawer } from "../../components/ui/Drawer";
import { AIResponseCard } from "../../components/ai/AIResponseCard";
import {
  getLiveMatchesApi,
  getUpcomingMatchesApi,
  getNewsApi,
  getNewsSummaryApi,
  getTopTransfersApi,
} from "../../api/football.api";
import { getAiRecommendationsApi } from "../../api/ai.api";

// Sub-components
import { DashboardBriefing } from "../../components/dashboard/DashboardBriefing";
import { DashboardAiRecommendations } from "../../components/dashboard/DashboardAiRecommendations";
import { DashboardLiveMatches } from "../../components/dashboard/DashboardLiveMatches";
import { DashboardUpcomingMatches } from "../../components/dashboard/DashboardUpcomingMatches";
import { DashboardNews } from "../../components/dashboard/DashboardNews";
import { DashboardStandings } from "../../components/dashboard/DashboardStandings";
import { DashboardLeaderboard } from "../../components/dashboard/DashboardLeaderboard";
import { DashboardTransfers } from "../../components/dashboard/DashboardTransfers";

export const Dashboard = () => {
  const [selectedNews, setSelectedNews] = useState(null);

  // Fetch live matches - poll every 30s
  const { data: liveMatches = [], isLoading: loadingLive } = useQuery({
    queryKey: ["liveMatches"],
    queryFn: getLiveMatchesApi,
    refetchInterval: 30000,
    staleTime: 10000,
  });

  // Fetch upcoming matches - cache for 10 minutes
  const { data: upcomingMatchesRaw = [], isLoading: loadingUpcoming } = useQuery({
    queryKey: ["upcomingMatches", "SCHEDULED"],
    queryFn: () => getUpcomingMatchesApi({ status: "SCHEDULED" }),
    staleTime: 600000,
  });

  const upcomingMatches = upcomingMatchesRaw.slice(0, 10);

  // Fetch news using news API
  const { data: news = [], isLoading: loadingNews } = useQuery({
    queryKey: ["news"],
    queryFn: () => getNewsApi(1),
  });

  // Fetch AI news summary when selectedNews is set
  const { data: newsSummaryData, isLoading: loadingSummary } = useQuery({
    queryKey: ["newsSummary", selectedNews?.id],
    queryFn: () => getNewsSummaryApi(selectedNews.id),
    enabled: !!selectedNews?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch top transfers with mock fallback
  const { data: transfersRaw = [], isLoading: loadingTransfers } = useQuery({
    queryKey: ["topTransfers"],
    queryFn: () => getTopTransfersApi(1),
  });

  const transfers = transfersRaw.length > 0 ? transfersRaw : TRANSFERS;

  // Fetch AI recommendations - cache for 10 minutes
  const { data: recommendations } = useQuery({
    queryKey: ["aiRecommendations"],
    queryFn: getAiRecommendationsApi,
    staleTime: 600000,
  });

  const isLoading =
    loadingLive ||
    loadingUpcoming ||
    loadingNews ||
    loadingTransfers;

  if (isLoading) {
    return <Loading text="Assembling tactical widgets..." />;
  }

  return (
    <div className="space-y-6">
      {/* AI Intelligence Brief Banner */}
      <DashboardBriefing briefing={recommendations?.briefing} />

      {/* Grid Layout of widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Live, Fixtures, News) */}
        <div className="lg:col-span-2 space-y-6">
          <DashboardLiveMatches liveMatches={liveMatches} />
          <DashboardUpcomingMatches upcomingMatches={upcomingMatches} />
          <DashboardNews news={news} onSelectNews={setSelectedNews} />
        </div>

        {/* Right Column (Sidebar widgets: AI Recommendations, Standings, Scorers, Transfers) */}
        <div className="space-y-6">
          <DashboardAiRecommendations
            recommendations={recommendations}
            liveMatches={liveMatches}
            upcomingMatchesRaw={upcomingMatchesRaw}
          />
          <DashboardStandings />
          <DashboardLeaderboard />
          <DashboardTransfers transfers={transfers} />
        </div>
      </div>

      <Drawer
        isOpen={!!selectedNews}
        onClose={() => setSelectedNews(null)}
        title="AI Intelligence Briefing"
        className="max-w-lg md:max-w-xl"
      >
        {selectedNews && (
          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto no-scrollbar space-y-4 pb-6">
            {/* Header Image & Info */}
            <div className="relative h-48 rounded-xl overflow-hidden shrink-0 border border-border">
              <img
                src={selectedNews.image}
                alt={selectedNews.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-left">
                <span className="text-[9px] text-primary font-bold uppercase bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 backdrop-blur-sm">
                  {selectedNews.date}
                </span>
                <h4 className="font-display font-bold text-text text-sm sm:text-base mt-2 leading-snug">
                  {selectedNews.title}
                </h4>
              </div>
            </div>

            {/* AI Summary Section */}
            <div className="flex-1 space-y-3 min-h-0 text-left">
              {loadingSummary ? (
                <div className="space-y-4 py-2">
                  <div className="flex gap-3.5 items-start">
                    <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary shrink-0 animate-pulse">
                      <Cpu size={16} />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="h-3 bg-border/20 rounded animate-pulse w-1/4" />
                      <div className="space-y-2">
                        <div className="h-4 bg-border/20 rounded animate-pulse w-full" />
                        <div className="h-4 bg-border/20 rounded animate-pulse w-5/6" />
                        <div className="h-4 bg-border/20 rounded animate-pulse w-full" />
                        <div className="h-4 bg-border/20 rounded animate-pulse w-2/3" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : newsSummaryData?.aiSummary ? (
                <AIResponseCard content={newsSummaryData.aiSummary} />
              ) : (
                <div className="text-center py-8 text-xs text-muted">
                  Could not load news summary. Please try again.
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default Dashboard;
