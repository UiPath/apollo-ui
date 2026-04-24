"use client";

/**
 * Static HTML preview mirroring the driver.js native popover DOM so the
 * theme overrides in `onboarding-tour-basic.css` style it identically.
 * See driver.js docs for the real DOM structure.
 */

// Import the registry CSS so the preview picks up the same theme overrides
// that the live tour uses.
import "@/registry/onboarding-tour-basic/onboarding-tour-basic.css";
import "driver.js/dist/driver.css";

export function PopoverStepPreview() {
  return (
    <div className="flex items-center justify-center rounded-lg bg-muted/20 p-8">
      <div id="tour-popover-preview" className="relative inline-block">
        {/* Mimic driver.js popover DOM so the CSS selectors apply. */}
        <div
          className="driver-popover onboarding-tour-basic"
          style={{
            position: "static",
            display: "block",
            transform: "none",
            pointerEvents: "auto",
          }}
        >
          <button
            type="button"
            className="driver-popover-close-btn"
            aria-label="Close"
          >
            &times;
          </button>
          <div className="driver-popover-title">Step popovers</div>
          <div className="driver-popover-description">
            driver.js renders the popover — we only style it. Title,
            description, and native next / previous / close buttons.
          </div>
          <div className="driver-popover-footer">
            <button type="button" className="driver-popover-prev-btn">
              &larr; Previous
            </button>
            <button type="button" className="driver-popover-next-btn">
              Next &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
