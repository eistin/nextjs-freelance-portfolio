interface FlagProps {
  className?: string;
  width?: number;
  height?: number;
}

export function FrenchFlag({ className = "", width = 20, height = 15 }: FlagProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 20 15"
      className={`rounded-sm ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <clipPath id="french-flag-clip">
          <rect width="20" height="15" rx="1" />
        </clipPath>
      </defs>
      <g clipPath="url(#french-flag-clip)">
        {/* Blue stripe */}
        <rect x="0" y="0" width="6.67" height="15" fill="#002654" />
        {/* White stripe */}
        <rect x="6.67" y="0" width="6.67" height="15" fill="#FFFFFF" />
        {/* Red stripe */}
        <rect x="13.33" y="0" width="6.67" height="15" fill="#ED2939" />
      </g>
    </svg>
  );
}

export function USFlag({ className = "", width = 20, height = 15 }: FlagProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 20 15"
      className={`rounded-sm ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <clipPath id="us-flag-clip">
          <rect width="20" height="15" rx="1" />
        </clipPath>
      </defs>
      <g clipPath="url(#us-flag-clip)">
        {/* Red stripes */}
        <rect x="0" y="0" width="20" height="15" fill="#B22234" />
        
        {/* White stripes */}
        <rect x="0" y="1.15" width="20" height="1.15" fill="#FFFFFF" />
        <rect x="0" y="3.46" width="20" height="1.15" fill="#FFFFFF" />
        <rect x="0" y="5.77" width="20" height="1.15" fill="#FFFFFF" />
        <rect x="0" y="8.08" width="20" height="1.15" fill="#FFFFFF" />
        <rect x="0" y="10.39" width="20" height="1.15" fill="#FFFFFF" />
        <rect x="0" y="12.69" width="20" height="1.15" fill="#FFFFFF" />
        
        {/* Blue field for stars */}
        <rect x="0" y="0" width="8" height="8.08" fill="#3C3B6E" />
        
        {/* Stars (simplified pattern) */}
        <g fill="#FFFFFF">
          {/* Row 1 */}
          <circle cx="1.3" cy="1" r="0.3" />
          <circle cx="2.7" cy="1" r="0.3" />
          <circle cx="4.1" cy="1" r="0.3" />
          <circle cx="5.5" cy="1" r="0.3" />
          <circle cx="6.9" cy="1" r="0.3" />
          
          {/* Row 2 */}
          <circle cx="2" cy="2" r="0.3" />
          <circle cx="3.4" cy="2" r="0.3" />
          <circle cx="4.8" cy="2" r="0.3" />
          <circle cx="6.2" cy="2" r="0.3" />
          
          {/* Row 3 */}
          <circle cx="1.3" cy="3" r="0.3" />
          <circle cx="2.7" cy="3" r="0.3" />
          <circle cx="4.1" cy="3" r="0.3" />
          <circle cx="5.5" cy="3" r="0.3" />
          <circle cx="6.9" cy="3" r="0.3" />
          
          {/* Row 4 */}
          <circle cx="2" cy="4" r="0.3" />
          <circle cx="3.4" cy="4" r="0.3" />
          <circle cx="4.8" cy="4" r="0.3" />
          <circle cx="6.2" cy="4" r="0.3" />
          
          {/* Row 5 */}
          <circle cx="1.3" cy="5" r="0.3" />
          <circle cx="2.7" cy="5" r="0.3" />
          <circle cx="4.1" cy="5" r="0.3" />
          <circle cx="5.5" cy="5" r="0.3" />
          <circle cx="6.9" cy="5" r="0.3" />
          
          {/* Row 6 */}
          <circle cx="2" cy="6" r="0.3" />
          <circle cx="3.4" cy="6" r="0.3" />
          <circle cx="4.8" cy="6" r="0.3" />
          <circle cx="6.2" cy="6" r="0.3" />
          
          {/* Row 7 */}
          <circle cx="1.3" cy="7" r="0.3" />
          <circle cx="2.7" cy="7" r="0.3" />
          <circle cx="4.1" cy="7" r="0.3" />
          <circle cx="5.5" cy="7" r="0.3" />
          <circle cx="6.9" cy="7" r="0.3" />
        </g>
      </g>
    </svg>
  );
}