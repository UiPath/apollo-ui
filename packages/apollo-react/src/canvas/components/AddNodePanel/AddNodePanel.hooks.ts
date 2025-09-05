import { useState, useCallback, useMemo } from "react";
import type { NodeOption } from "./AddNodePanel.types";

export const useNodeSearch = (nodes: NodeOption[]) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const searchedNodes = useMemo(() => {
    if (!searchQuery.trim()) return nodes;

    const query = searchQuery.toLowerCase();
    return nodes.filter(
      (node) =>
        node.label.toLowerCase().includes(query) ||
        node.description?.toLowerCase().includes(query) ||
        node.type.toLowerCase().includes(query)
    );
  }, [nodes, searchQuery]);

  const handleSearchToggle = useCallback(() => {
    setIsSearching((prev) => !prev);
    if (isSearching) {
      setSearchQuery("");
    }
  }, [isSearching]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setIsSearching(false);
  }, []);

  return {
    searchQuery,
    isSearching,
    searchedNodes,
    handleSearchToggle,
    handleSearchChange,
    clearSearch,
  };
};
