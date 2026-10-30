import { Link } from "react-router-dom";

export function Drop({ size = 22, color = "#6E9A82", filled = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3c3 4 6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 3-7 6-11Z"
        stroke={color}
        strokeWidth="1.8"
        fill={filled ? color : "none"}
        fillOpacity={filled ? 0.35 : undefined}
      />
      {!filled && <path d="M12 10v7" stroke={color} strokeWidth="1.6" strokeLinecap="round" />}
    </svg>
  );
}

export default function Brand({ color = "#6E9A82", to = "/" }) {
  return (
    <Link className="brand" to={to}>
      <Drop color={color} />
      Skin Care Hub
    </Link>
  );
}
