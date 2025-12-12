import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Box, PanelLeft } from "lucide-react";

interface CompanyProps {
    isCollapsed: boolean;
    toggleCollapse: () => void;
    companyName: string;
    productName: string;
}

export const Company = ({ isCollapsed, toggleCollapse, companyName, productName }: CompanyProps) => {
    return <div className={"flex items-center justify-between h-7 pt-2"}>
        {!isCollapsed && <div className={"flex items-center gap-2"}>
          <div className="w-7 h-7 rounded-md bg-[#51B0BE] flex items-center justify-center shrink-0">
            <Box className="w-4 h-4 text-[#1A1E27]" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm text-white truncate">{companyName}</span>
            <span className="text-xs text-white/70 truncate">{productName}</span>
          </div>
        </div>}

        {isCollapsed && <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleCollapse}
                className="flex items-center justify-center cursor-pointer w-7 h-7"
              >
                <div className="w-7 h-7 rounded-md bg-[#51B0BE] flex items-center justify-center">
                  <Box className="w-4 h-4 text-[#1A1E27]" />
                </div>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <div className="flex flex-col gap-0.5">
                <span className="font-xs">{companyName}</span>
                <span className="text-xs opacity-70">{productName}</span>
              </div>
            </TooltipContent>
          </Tooltip>}

        {!isCollapsed && <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleCollapse}
          className={"h-8 w-8 ml-auto shrink-0"}
        >
          <PanelLeft className="w-4 h-4" />
        </Button>}
      </div>;
}