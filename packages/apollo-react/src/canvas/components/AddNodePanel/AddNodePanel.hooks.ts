import { useState, useCallback } from "react";

export const useNodeSearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

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
    handleSearchToggle,
    handleSearchChange,
    clearSearch,
  };
};
