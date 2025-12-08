import { Button } from "@/components/ui/button";
import { HelpCircle, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface WelcomeTourButtonProps {
  onClick: () => void;
  variant?: "default" | "outline" | "ghost";
}

export const WelcomeTourButton = ({ onClick, variant = "ghost" }: WelcomeTourButtonProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size="icon"
            onClick={onClick}
            className="relative"
          >
            <HelpCircle className="h-5 w-5" />
            <span className="sr-only">Welcome Tour</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Welcome Tour & App Info</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
