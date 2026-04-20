import React, { useState, useRef } from "react";
import Hold360, { HoldScrollContext } from "../stubs/Hold360";
import { useQuery } from "@tanstack/react-query";
import HandleAddHold from "../utils/HandleAddHold";
import { useEditorAuth } from "../mocks/useEditorAuth";
import PaginationList from "../stubs/PaginationList";
import { useTranslation } from "react-i18next";
import type { HoldModel, SessionData } from "../store";

type StockItem = {
  id: string | number;
  hold_type: { id: string | number; cdn_ref?: string; [key: string]: unknown };
  model?: string;
  [key: string]: unknown;
};

interface AddHoldModalProps {
  isOpen: boolean;
  onClose: () => void;
  session_data: SessionData;
  onHoldAdded: (hold: HoldModel) => void;
  currentHolds: HoldModel[];
}

export default function AddHoldModal({
  isOpen,
  onClose,
  session_data,
  onHoldAdded,
  currentHolds,
}: AddHoldModalProps) {
  const [search, setSearch] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const scrollRef = useRef<HTMLElement>(null);
  const [addedHoldIds, setAddedHoldIds] = useState<Set<string | number>>(new Set());
  const { user, authenticatedFetch } = useEditorAuth();
  const [page, setPage] = useState(1);
  const API_URL = import.meta.env.VITE_API_BASE;
  const { t } = useTranslation();
  const gym_id = user?.related_gym_id;

  React.useEffect(() => {
    if (isOpen) {
      setAddedHoldIds(new Set());
      setPage(1);
    }
  }, [isOpen]);

  const { data, isLoading, error, isError } = useQuery({
    queryKey: ["gymstocks", gym_id, page],
    queryFn: async () => {
      if (!gym_id) {
        return { count: 0, stock: [], holds: [] };
      }
      let url: string;
      if (API_URL.startsWith("http://") || API_URL.startsWith("https://")) {
        const baseUrl = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;
        const urlObj = new URL(`/gym/stock-explore/${gym_id}/`, baseUrl);
        urlObj.searchParams.set("page", page.toString());
        urlObj.searchParams.set("page_size", "100");
        urlObj.searchParams.set("sorting", "color");
        url = urlObj.toString();
      } else {
        const baseUrl = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;
        const params = new URLSearchParams({
          page: page.toString(),
          page_size: "100",
          sorting: "color",
        });
        url = `${baseUrl}/gym/stock-explore/${gym_id}/?${params.toString()}`;
      }
      console.log("[AddHoldModal] Fetching stock from:", url);
      const response = await authenticatedFetch(url);
      console.log("[AddHoldModal] Stock response status:", response.status);
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        console.error("[AddHoldModal] Stock fetch error:", errorBody);
        throw new Error(
          errorBody.message || `Failed to fetch (status ${response.status})`
        );
      }
      const json = await response.json();
      console.log("[AddHoldModal] Stock data:", json);
      return json;
    },
    enabled: isOpen && !!gym_id,
    staleTime: 2 * 60 * 1000,
    retry: 1,
    retryDelay: 1000,
  });

  const holds_number = data?.count || 0;
  const rawStockData = data?.stock || data?.holds || [];

  const currentHoldTypeIds = new Set(
    currentHolds.map((h: HoldModel) => h.hold_type.id)
  );

  const deduplicatedStockData = Array.isArray(rawStockData)
    ? rawStockData.reduce((acc: StockItem[], current: StockItem) => {
        const exists = acc.find(
          (hold) => hold.hold_type.id === current.hold_type.id
        );
        if (!exists) acc.push(current);
        return acc;
      }, [])
    : rawStockData;

  const stockData = Array.isArray(deduplicatedStockData)
    ? deduplicatedStockData.filter(
        (hold: StockItem) =>
          !currentHoldTypeIds.has(hold.hold_type.id) &&
          !addedHoldIds.has(hold.hold_type.id)
      )
    : deduplicatedStockData;

  const filteredStockData = Array.isArray(stockData)
    ? stockData.filter((hold: StockItem) => {
        if (!search) return true;
        const searchLower = search.toLowerCase();
        const manufacturerName = hold.hold_type?.manufacturer_name as string | undefined;
        return (
          hold.model?.toLowerCase().includes(searchLower) ||
          manufacturerName?.toLowerCase().includes(searchLower)
        );
      })
    : stockData;

  const handleAddHoldClick = async (hold: StockItem) => {
    setIsAdding(true);
    try {
      const result = await HandleAddHold(hold, session_data, onHoldAdded);
      if (result.success) {
        await authenticatedFetch(
          `${API_URL}/gym/changeholdtosessioncollection/${session_data.id}/1/${hold.id}/`
        );
        setAddedHoldIds((prev) => new Set([...prev, hold.hold_type.id]));
      } else {
        alert(t("Erreur lors de l'ajout de la prise: ") + result.error);
      }
    } catch (err) {
      console.error("Error adding hold:", err);
      alert(t("Erreur lors de l'ajout de la prise"));
    } finally {
      setIsAdding(false);
    }
  };

  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 bg-black/50 flex justify-center items-center z-50"
      style={{ display: isOpen ? "flex" : "none" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 flex flex-col"
        style={{
          minWidth: "600px",
          minHeight: "500px",
          maxWidth: "90vw",
          maxHeight: "90vh",
          height: "600px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">{t("Ajouter une prise")}</h1>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
          >
            ×
          </button>
        </div>

        <input
          type="text"
          className="w-full p-2 border border-gray-300 rounded-md mb-4"
          placeholder={t("Chercher par nom...")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {isAdding && (
          <div className="mb-4 text-blue-600">
            {t("Ajout de la prise en cours")}...
          </div>
        )}

        <HoldScrollContext.Provider value={scrollRef}>
        <div ref={scrollRef as React.RefObject<HTMLDivElement>} className="w-full flex-1 overflow-y-auto">
          {isLoading || data === undefined ? (
            <div className="flex justify-center items-center h-32">
              <div className="text-gray-500">
                {t("Chargement des prises")}...
              </div>
            </div>
          ) : isError ? (
            <div className="flex justify-center items-center h-32">
              <div className="text-red-500">
                {t("Erreur lors du chargement")}:{" "}
                {(error as Error)?.message || t("Erreur inconnue")}
              </div>
            </div>
          ) : (
            <>
              {Array.isArray(filteredStockData) &&
              filteredStockData.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-2">
                  {filteredStockData.map((hold) => (
                    <div
                      key={hold.id}
                      className={`flex flex-col gap-1 items-center ${
                        isAdding
                          ? "opacity-50 pointer-events-none"
                          : "cursor-pointer"
                      }`}
                      onClick={() => !isAdding && handleAddHoldClick(hold)}
                    >
                      <div className="group relative flex flex-col items-center justify-center pb-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-gray-300 transition-all cursor-grab active:cursor-grabbing select-none w-full">
                        <div className="w-30 h-30">
                          <Hold360
                            hold={hold}
                            cdn_ref={hold.hold_type.cdn_ref}
                            className="w-full h-full"
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 text-center">
                          {hold?.model || t("Nom inconnu")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex justify-center items-center h-32">
                  <div className="text-gray-500">
                    {t("Aucune prise disponible dans le stock")}
                  </div>
                </div>
              )}
              <div className="flex justify-center mt-4">
                <PaginationList
                  holds_number={holds_number}
                  currentPage={page}
                  setCurrentPage={setPage}
                />
              </div>
            </>
          )}
        </div>
        </HoldScrollContext.Provider>
      </div>
    </div>
  );
}
