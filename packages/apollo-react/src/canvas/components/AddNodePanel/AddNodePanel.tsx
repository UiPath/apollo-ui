import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { ApIcon, ApIconButton, ApSkeleton, ApTextField, ApTypography } from "@uipath/portal-shell-react";
import { FontVariantToken } from "@uipath/apollo-core";
import { Column, Row } from "@uipath/uix-core";
import { ScrollableList, ListItemButton, IconContainer, AnimatedContainer, AnimatedContent } from "./AddNodePanel.styles";
import type { AddNodePanelProps, NodeOption, NodeCategory } from "./AddNodePanel.types";
import { useNodeSearch } from "./AddNodePanel.hooks";
import { useOptionalRegistryNodeOptions } from "./useRegistryNodeOptions";

type ViewState = "categories" | "nodes";

interface HeaderProps {
  title: string;
  onBack?: () => void;
  onSearch?: () => void;
  onClose: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, onBack, onSearch, onClose }) => (
  <Row justify="space-between" align="center" gap={6} mb={10}>
    <Row align="center" gap={8}>
      {onBack && (
        <ApIconButton color="secondary" onClick={onBack}>
          <ApIcon name="arrow_back" size="20px" />
        </ApIconButton>
      )}
      <ApTypography variant={FontVariantToken.fontSizeMBold}>{title}</ApTypography>
    </Row>
    <Row align="center" gap={6}>
      {onSearch && (
        <ApIconButton color="secondary" onClick={onSearch}>
          <ApIcon name="search" size="20px" />
        </ApIconButton>
      )}
      <ApIconButton color="secondary" onClick={onClose}>
        <ApIcon name="close" size="20px" />
      </ApIconButton>
    </Row>
  </Row>
);

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SearchBox: React.FC<SearchBoxProps> = ({ value, onChange, placeholder = "Search..." }) => (
  <ApTextField
    type="text"
    placeholder={placeholder}
    value={value}
    size="small"
    startAdornment={<ApIcon name="search" size="16px" />}
    onValueChanged={(e) => onChange(e.detail)}
    autoFocus
  />
);

type ListItem = NodeCategory | NodeOption;

interface ListViewProps<T extends ListItem> {
  items: T[];
  onItemClick: (item: T) => void;
  getItemColor?: (item: T) => string | undefined;
  showEmptyState?: boolean;
  emptyStateMessage?: string;
  emptyStateIcon?: string;
  isLoading?: boolean;
}

const ListView = <T extends ListItem>(props: ListViewProps<T>) => {
  const {
    items,
    onItemClick,
    getItemColor,
    showEmptyState = false,
    emptyStateMessage = "No items found",
    emptyStateIcon = "search_off",
    isLoading = false,
  } = props;

  if (isLoading && items.length === 0) {
    return (
      <Column gap={10}>
        {[...Array(3)].map((_, index) => (
          <ApSkeleton variant="rectangle" style={{ height: "32px", width: "100%" }} key={index} />
        ))}
      </Column>
    );
  }

  // Show empty state if no items and explicitly requested
  if (items.length === 0 && showEmptyState) {
    return (
      <Column align="center" justify="center" flex={1} gap={10} style={{ minHeight: "250px" }}>
        <ApIcon name={emptyStateIcon} size="48px" color="var(--color-foreground-de-emp)" />
        <ApTypography variant={FontVariantToken.fontSizeS} color="var(--color-foreground-de-emp)">
          {emptyStateMessage}
        </ApTypography>
      </Column>
    );
  }

  return (
    <ScrollableList>
      {items.map((item) => {
        // Determine the background color - use provided function or item's color if it's a category
        const bgColor = getItemColor ? getItemColor(item) : "color" in item ? item.color : undefined;

        return (
          <ListItemButton key={item.id} onClick={() => onItemClick(item)}>
            <IconContainer bgColor={bgColor}>
              {item.icon &&
                (typeof item.icon === "string" ? (
                  <ApIcon name={item.icon} size="18px" color="var(--color-foreground-de-emp)" />
                ) : (
                  <item.icon />
                ))}
            </IconContainer>
            <Column flex={1}>
              <ApTypography variant={FontVariantToken.fontSizeS}>{item.label}</ApTypography>
            </Column>
          </ListItemButton>
        );
      })}
    </ScrollableList>
  );
};

export const AddNodePanel: React.FC<AddNodePanelProps> = ({ onNodeSelect, onClose, categories }) => {
  const registryOptions = useOptionalRegistryNodeOptions();

  const finalCategories = useMemo(() => categories || registryOptions?.getCategories() || [], [categories, registryOptions]);
  const [viewState, setViewState] = useState<ViewState>("categories");
  const [selectedCategory, setSelectedCategory] = useState<NodeCategory | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const { searchQuery, isSearching, handleSearchToggle, handleSearchChange, clearSearch } = useNodeSearch();

  const handleBack = useCallback(() => {
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }

    setIsTransitioning(true);
    setViewState("categories");
    setSelectedCategory(null);

    if (isSearching) {
      clearSearch();
    }

    transitionTimeoutRef.current = setTimeout(() => setIsTransitioning(false), 150);
  }, [clearSearch, isSearching]);

  const handleCategorySelect = useCallback(
    (category: NodeCategory) => {
      // Clear any pending transitions
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }

      setIsTransitioning(true);
      setSelectedCategory(category);
      setViewState("nodes");

      // Only clear search if actively searching
      if (isSearching) {
        clearSearch();
      }

      // Reset transition state after animation
      transitionTimeoutRef.current = setTimeout(() => {
        setIsTransitioning(false);
      }, 150);
    },
    [clearSearch, isSearching]
  );

  const handleNodeSelect = useCallback(
    (node: NodeOption) => {
      onNodeSelect(node);
      onClose();
    },
    [onNodeSelect, onClose]
  );

  const onSearch = useCallback(
    (query: string) => {
      handleSearchChange(query);
      setViewState(query.length > 0 ? "nodes" : "categories");
    },
    [handleSearchChange]
  );

  const filteredNodes = useMemo(() => {
    return registryOptions.search(selectedCategory?.id, searchQuery.toLowerCase());
  }, [registryOptions, selectedCategory, searchQuery]);

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isSearching) {
          clearSearch();
        } else if (viewState === "nodes" && selectedCategory) {
          handleBack();
        } else {
          onClose();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, viewState, selectedCategory, isSearching, clearSearch, handleBack]);

  const content = React.useMemo(() => {
    if (viewState === "categories") {
      return <ListView items={finalCategories} onItemClick={handleCategorySelect} showEmptyState={false} />;
    }

    if (viewState === "nodes") {
      return (
        <ListView
          items={filteredNodes}
          onItemClick={handleNodeSelect}
          showEmptyState={filteredNodes.length === 0}
          emptyStateMessage="No nodes found"
        />
      );
    }

    return null;
  }, [viewState, finalCategories, handleCategorySelect, filteredNodes, handleNodeSelect]);

  return (
    <Column p={10} w={320}>
      <Header
        title={viewState === "categories" ? "Choose node" : selectedCategory?.label || "Nodes"}
        onBack={viewState === "nodes" ? handleBack : undefined}
        onSearch={handleSearchToggle}
        onClose={onClose}
      />

      {isSearching && (
        <SearchBox
          value={searchQuery}
          onChange={onSearch}
          placeholder={viewState === "categories" ? "Search all nodes..." : `Search ${selectedCategory?.label?.toLowerCase()}...`}
        />
      )}

      <AnimatedContainer>
        <AnimatedContent entering={isTransitioning} direction={viewState === "nodes" ? "forward" : "back"}>
          {content}
        </AnimatedContent>
      </AnimatedContainer>
    </Column>
  );
};
