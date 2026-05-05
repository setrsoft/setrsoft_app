import { useEditorAuth } from "../mocks/useEditorAuth";

type SessionDataWithLayout = {
  id?: string | number;
  layout?: string | { objects?: Array<{ type?: string; url?: string; [key: string]: unknown }> };
  [key: string]: unknown;
};

type StockHold = {
  id?: string | number;
  hold_type?: { id?: string | number; model?: string; manufacturer_ref?: string; cdn_ref?: string; manufacturer?: string | { name?: string } };
  available_count?: number;
  last_used_wall?: { wall_name?: string; session_name?: string; wall_id?: string | number; session_id?: string | number };
};

export function useHoldAvailabilityValidation() {
  const { authenticatedFetch, user } = useEditorAuth();
  const API_URL = import.meta.env.VITE_API_BASE;
  const gym_id = user?.related_gym_id;

  const validateHoldAvailability = async (sessionData: SessionDataWithLayout) => {
    try {
      const stockResponse = await authenticatedFetch(
        `${API_URL}/gym/stock-explore/${gym_id}/?page_size=1000`
      );

      if (!stockResponse.ok) {
        throw new Error("Failed to fetch stock data");
      }

      const stockData = await stockResponse.json();
      const stockHolds: StockHold[] = stockData.holds || [];

      let layout = sessionData.layout;
      if (typeof layout === "string") {
        try {
          layout = JSON.parse(layout);
        } catch (error) {
          console.error("Failed to parse layout JSON:", error);
          return { isValid: false, unavailableHolds: [] };
        }
      }

      type ParsedLayout = { objects?: Array<{ type?: string; url?: string; [key: string]: unknown }> };
      const parsedLayout = layout as ParsedLayout | null | undefined;
      if (!parsedLayout || !parsedLayout.objects || parsedLayout.objects.length === 0) {
        return { isValid: true, unavailableHolds: [] };
      }

      const requiredHolds: Record<number, number> = {};
      parsedLayout.objects.forEach((obj) => {
        if (obj.type === "hold") {
          const holdTypeId = extractHoldTypeIdFromUrl(obj.url);
          if (holdTypeId) {
            requiredHolds[holdTypeId] = (requiredHolds[holdTypeId] ?? 0) + 1;
          }
        }
      });

      if (Object.keys(requiredHolds).length === 0) {
        return { isValid: true, unavailableHolds: [] };
      }

      const unavailableHolds = [];
      for (const [holdTypeId, requiredCount] of Object.entries(requiredHolds)) {
        const stockHold = stockHolds.find((h) => h.hold_type?.id == holdTypeId);
        if (!stockHold) {
          unavailableHolds.push({
            hold_type_id: holdTypeId,
            hold_name: `Unknown Hold Type ${holdTypeId}`,
            manufacturer: "Unknown",
            required_count: requiredCount,
            available_count: 0,
            current_location: "Not found in stock",
          });
        } else {
          const availableCount = stockHold.available_count || 0;
          if (availableCount < (requiredCount as number)) {
            unavailableHolds.push({
              hold_type_id: holdTypeId,
              hold_name:
                stockHold.hold_type?.model ||
                stockHold.hold_type?.manufacturer_ref ||
                stockHold.hold_type?.cdn_ref ||
                `Hold Type ${holdTypeId}`,
              manufacturer: (() => {
                const mfr = stockHold.hold_type?.manufacturer;
                if (typeof mfr === 'object' && mfr !== null) return mfr.name ?? "Unknown";
                return (mfr as string | undefined) ?? "Unknown";
              })(),
              required_count: requiredCount,
              available_count: availableCount,
              current_location:
                stockHold.last_used_wall?.wall_name ||
                stockHold.last_used_wall?.session_name ||
                `Wall ${stockHold.last_used_wall?.wall_id}` ||
                "Unknown location",
              current_session_id: stockHold.last_used_wall?.session_id,
              current_wall_id: stockHold.last_used_wall?.wall_id,
            });
          }
        }
      }

      return { isValid: unavailableHolds.length === 0, unavailableHolds };
    } catch (error) {
      console.error("Error validating hold availability:", error);
      return { isValid: false, unavailableHolds: [] };
    }
  };

  const extractHoldTypeIdFromUrl = (url: string | undefined) => {
    if (!url) return null;
    const match = url.match(/\/gym\/getholdfile\/hold\/(\d+)\//);
    return match ? parseInt(match[1]) : null;
  };

  return { validateHoldAvailability };
}
