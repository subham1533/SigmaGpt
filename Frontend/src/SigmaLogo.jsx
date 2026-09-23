import React from "react";

export function SigmaLogo({ size = 28, className = "" }) {
    return (
        <svg 
            width={size} 
            height={size} 
            viewBox="0 0 32 32" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <rect width="32" height="32" rx="9" fill="#18181b" stroke="#3f3f46" strokeWidth="1.2" />
            <path 
                d="M10 8.5H22L15 16L22 23.5H10" 
                stroke="#ffffff" 
                strokeWidth="2.4" 
                strokeLinecap="round" 
                strokeLinejoin="round"
            />
        </svg>
    );
}

export default SigmaLogo;
