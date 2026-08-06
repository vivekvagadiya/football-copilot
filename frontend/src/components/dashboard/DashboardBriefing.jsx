import React from "react";
import { useNavigate } from "react-router-dom";
import { Cpu } from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";

export const DashboardBriefing = ({ briefing }) => {
  const navigate = useNavigate();

  return (
    <Card className="border border-primary/20 bg-primary/5 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex gap-3 items-center">
        <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-primary shrink-0 animate-pulse">
          <Cpu size={20} />
        </div>
        <div>
          <h3 className="font-display font-bold text-text text-sm flex items-center gap-2">
            Football Copilot Briefing
          </h3>
          <p className="text-xs text-muted max-w-xl animate-fade-in">
            {briefing || "Arsenal takes on Manchester City today in the match of the season. Haaland leads goals with 28. Real Madrid closes in on Zubimendi."}
          </p>
        </div>
      </div>
      <Button
        variant="primary"
        size="sm"
        onClick={() => navigate("/ai")}
        className="text-xs shrink-0"
      >
        Ask Copilot
      </Button>
    </Card>
  );
};
