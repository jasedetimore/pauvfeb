import React from "react";
import { SingleIssuerResponse } from "@/types/market";
import { getPreviewUrl } from "@/lib/utils";

interface Issuer {
  ticker: string;
  name?: string | null;
  public_display_name?: string | null;
  image_url?: string | null;
  photo_url?: string | null;
  logo_url?: string | null;
  headline?: string | null;
  short_bio?: string | null;
  bio?: string | null;
  long_bio?: string | null;
}

interface IssuerHeaderProps {
  issuer: Issuer;
  singleIssuerData?: SingleIssuerResponse | null;
  showLongBio: boolean;
  onToggleLongBio: (show: boolean) => void;
}

export const IssuerHeader: React.FC<IssuerHeaderProps> = ({
  issuer,
  singleIssuerData,
  showLongBio,
  onToggleLongBio,
}) => {
  const [imgError, setImgError] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [showSeeMore, setShowSeeMore] = React.useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // Vérifier après un court délai pour s'assurer que le rendu est complet
    const timer = setTimeout(() => {
      if (contentRef.current) {
        const bioText = issuer.short_bio || issuer.bio;
        const hasContent = !!bioText;
        const isOverflowing =
          contentRef.current.scrollHeight > contentRef.current.clientHeight;
        setShowSeeMore(hasContent && isOverflowing);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [issuer.short_bio, issuer.bio]);

  const apiBase = process.env.NEXT_PUBLIC_BACKEND_URL
    ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api`
    : "";
  
  const rawImg = singleIssuerData?.image_url || issuer.image_url || issuer.photo_url || issuer.logo_url;
  let img = rawImg;

  if (rawImg && typeof rawImg === "string") {
    const processed = getPreviewUrl(rawImg);
    
    // If getPreviewUrl resolved it to a full URL (likely via backend proxy logic), use it
    if (processed.startsWith('http')) {
      img = processed;
    } 
    // Handle specific legacy relative paths that don't start with / (assumed to be under /api/)
    // Only apply this if getPreviewUrl didn't already handle it (returns same relative path)
    else if (!rawImg.startsWith("http") && !rawImg.startsWith("/")) {
      img = apiBase + "/" + rawImg;
    }
    else {
      img = processed;
    }
  }

  // Get the first character for fallback
  const getFallbackInitial = () => {
    const name =
      singleIssuerData?.full_name ||
      issuer.public_display_name ||
      issuer.name ||
      issuer.ticker ||
      "";
    return name.charAt(0).toUpperCase() || "?";
  };

  return (
    <>
      <div className="flex flex-col min-w-0">
        <div className="flex items-start w-full justify-between gap-4 p-1">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {img && !imgError ? (
              <img
                src={img}
                alt="logo"
                className="w-20 h-20 rounded-full object-cover flex-shrink-0"
                onError={() => setImgError(true)}
              />
            ) : (
              <span className="w-20 h-20 rounded-full border border-neutral-600 flex items-center justify-center text-white font-medium text-xl bg-white/10 flex-shrink-0">
                {getFallbackInitial()}
              </span>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-white font-mono font-bold truncate text-[2rem] md:text-[2.2rem] leading-none">
                {singleIssuerData?.full_name ||
                  issuer.public_display_name ||
                  issuer.name ||
                  issuer.ticker}
              </h1>
              {issuer?.headline && (
                <div className="text-sm text-white font-light">
                  {issuer.headline}
                </div>
              )}
            </div>
          </div>
        </div>

        {(issuer?.short_bio || issuer?.bio) && (
          <>
            <div
              ref={contentRef}
              className={`pl-1 ${!isExpanded ? "line-clamp-3" : ""}`}
            >
              <p className="text-sm text-neutral-400 leading-relaxed">
                {issuer.short_bio || issuer.bio}
              </p>
            </div>
            
            {showSeeMore && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full text-sm font-normal text-white underline hover:text-neutral-200 cursor-pointer transition-colors mt-1"
              >
                {isExpanded ? "Show Less" : "See More"}
              </button>
            )}
          </>
        )}
      </div>
      {issuer?.long_bio && (
        <div className="pl-0 mt-2">
          {!showLongBio ? (
            <button
              onClick={() => onToggleLongBio(true)}
              className="text-xs underline opacity-80 hover:opacity-100"
            >
              See more
            </button>
          ) : (
            <div className="space-y-1">
              <p className="text-xs leading-relaxed whitespace-pre-wrap">
                {issuer.long_bio}
              </p>
              <button
                onClick={() => onToggleLongBio(false)}
                className="text-xs underline opacity-80 hover:opacity-100"
              >
                Show less
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
};
