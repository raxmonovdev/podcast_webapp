import { useState } from "react";

export default function Cover({ src, alt, className }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return <div className={"cover-fallback " + (className || "")} aria-hidden="true" />;
  }
  return (
    <img
      src={src}
      alt={alt || ""}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
