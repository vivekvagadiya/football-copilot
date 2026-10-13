import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight 
} from 'lucide-react';

/**
 * Reusable Common Pagination Component
 * 
 * @param {number} page - Current active page (1-indexed)
 * @param {number} totalPages - Total number of pages
 * @param {number} total - Total count of items
 * @param {number} limit - Items per page
 * @param {Array<number>} pageSizeOptions - Available page size options (e.g. [5, 10, 20])
 * @param {Function} onPageChange - Callback when page changes (newPage) => void
 * @param {Function} onPageSizeChange - Callback when page size changes (newLimit) => void
 * @param {boolean} disabled - Disable pagination buttons (e.g. during loading/fetching)
 * @param {string} itemLabel - Label for items (default: 'items')
 * @param {boolean} showPageSize - Whether to render page size selector
 * @param {boolean} showTotal - Whether to render "Showing X-Y of Z"
 * @param {boolean} showFirstLast - Whether to render first/last page buttons
 * @param {string} className - Optional container styling
 */
export const Pagination = ({
  page = 1,
  totalPages: propTotalPages,
  total,
  limit = 10,
  pageSizeOptions = [5, 10, 20],
  onPageChange,
  onPageSizeChange,
  disabled = false,
  itemLabel = 'items',
  showPageSize = true,
  showTotal = true,
  showFirstLast = true,
  className = '',
}) => {
  const resolvedTotalPages = propTotalPages ?? (
    total != null && limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1
  );

  // If there are no items and only 1 page, and no page-size control needed, hide
  if (resolvedTotalPages <= 1 && total === 0) {
    return null;
  }

  const startItem = total != null ? (total === 0 ? 0 : (page - 1) * limit + 1) : null;
  const endItem = total != null ? Math.min(page * limit, total) : null;

  // Generate numbered pills with smart ellipsis
  const getPageNumbers = (current, maxPages) => {
    if (maxPages <= 5) {
      return Array.from({ length: maxPages }, (_, i) => i + 1);
    }
    if (current <= 3) {
      return [1, 2, 3, 4, '...', maxPages];
    }
    if (current >= maxPages - 2) {
      return [1, '...', maxPages - 3, maxPages - 2, maxPages - 1, maxPages];
    }
    return [1, '...', current - 1, current, current + 1, '...', maxPages];
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > resolvedTotalPages || newPage === page || disabled) {
      return;
    }
    onPageChange?.(newPage);
  };

  return (
    <div 
      className={`pt-2 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4 select-none ${className}`}
    >
      {/* Left side: Range & Page size */}
      <div className="flex items-center gap-3 text-xs text-muted w-full sm:w-auto justify-between sm:justify-start">
        {showTotal && total != null && (
          <span>
            Showing <span className="font-semibold text-text">{startItem}-{endItem}</span> of <span className="font-semibold text-text">{total}</span> {itemLabel}
          </span>
        )}

        {showPageSize && onPageSizeChange && pageSizeOptions?.length > 0 && (
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-[11px] text-muted">Per page:</span>
            <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-0.5">
              {pageSizeOptions.map((size) => (
                <button
                  key={size}
                  type="button"
                  disabled={disabled}
                  onClick={() => onPageSizeChange(size)}
                  className={`px-2 py-0.5 text-[10px] font-mono rounded-md transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    limit === size 
                      ? 'bg-primary text-[#07120D] font-extrabold shadow-xs' 
                      : 'text-muted hover:text-text hover:bg-border/30'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right side: Page Navigation Buttons */}
      {resolvedTotalPages > 1 && (
        <div className="flex items-center gap-1">
          {/* First page button */}
          {showFirstLast && (
            <button
              type="button"
              onClick={() => handlePageChange(1)}
              disabled={page <= 1 || disabled}
              className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border bg-card text-muted hover:text-text hover:bg-border/30 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
              title="First page"
            >
              <ChevronsLeft size={14} />
            </button>
          )}

          {/* Previous page button */}
          <button
            type="button"
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1 || disabled}
            className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border bg-card text-muted hover:text-text hover:bg-border/30 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            title="Previous page"
          >
            <ChevronLeft size={14} />
          </button>

          {/* Numbered page buttons */}
          <div className="flex items-center gap-1 mx-1">
            {getPageNumbers(page, resolvedTotalPages).map((pageNum, idx) => {
              if (pageNum === '...') {
                return (
                  <span key={`ellipsis-${idx}`} className="px-1.5 text-xs text-muted font-mono">
                    ...
                  </span>
                );
              }

              const isCurrent = page === pageNum;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => handlePageChange(pageNum)}
                  disabled={disabled}
                  className={`h-8 min-w-[32px] px-2 text-xs font-mono font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    isCurrent
                      ? 'bg-primary text-[#07120D] shadow-xs'
                      : 'bg-card text-muted hover:text-text border border-border hover:bg-border/30'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          {/* Next page button */}
          <button
            type="button"
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= resolvedTotalPages || disabled}
            className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border bg-card text-muted hover:text-text hover:bg-border/30 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            title="Next page"
          >
            <ChevronRight size={14} />
          </button>

          {/* Last page button */}
          {showFirstLast && (
            <button
              type="button"
              onClick={() => handlePageChange(resolvedTotalPages)}
              disabled={page >= resolvedTotalPages || disabled}
              className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border bg-card text-muted hover:text-text hover:bg-border/30 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
              title="Last page"
            >
              <ChevronsRight size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Pagination;
