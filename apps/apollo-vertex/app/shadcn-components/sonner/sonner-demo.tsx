"use client";

import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/registry/button/button";

export function SonnerDemo() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        onClick={() =>
          toast("Event has been created", {
            description: "Sunday, December 03, 2023 at 9:00 AM",
          })
        }
      >
        {t("show_toast")}
      </Button>
      <Button variant="outline" onClick={() => toast.success("Success!")}>
        {t("success")}
      </Button>
      <Button variant="outline" onClick={() => toast.error("Error!")}>
        {t("error")}
      </Button>
      <Button variant="outline" onClick={() => toast.warning("Warning!")}>
        {t("warning")}
      </Button>
      <Button variant="outline" onClick={() => toast.info("Info!")}>
        {t("info")}
      </Button>
    </div>
  );
}
