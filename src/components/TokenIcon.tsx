import { useState, useMemo } from "react";
import defaultLogo from "../assets/token/default.png";
import "./TokenSelect.css";

type Props = {
  src?: string | null;
  alt?: string;
  size?: number;     
  className?: string;
  rounded?: boolean;   
};

export default function TokenIcon({
  src,
  alt = "",
  size = 28,
  className = "",
  rounded = true,
}: Props) {
  const [broken, setBroken] = useState(false);

  
  const imgSrc = useMemo(() => {
    if (!src || String(src).trim() === "" || broken) return defaultLogo;
    return src;
  }, [src, broken]);

  return (
    <img
      src={imgSrc}
      alt={alt}
      width={size}
      height={size}
      className={`tkicon ${rounded ? "round" : ""} ${className}`}
      onError={() => setBroken(true)}
      loading="lazy"
      decoding="async"
    />
  );
}
