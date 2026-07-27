import React, { useState } from 'react';

export const TeamLogo = ({ logo, name = '', className = 'w-4 h-4', fallbackSize = 'text-sm' }) => {
  const [hasError, setHasError] = useState(false);

  const isUrl = logo && (logo.startsWith('http') || logo.startsWith('/'));

  if (isUrl && !hasError) {
    return (
      <div className={`${className} flex items-center justify-center bg-white rounded-full p-0.5 shadow-sm shrink-0`}>
        <img
          src={logo}
          alt={name}
          onError={() => setHasError(true)}
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  // Fallback to emoji or default soccer ball emoji if url load fails
  const fallbackEmoji = !isUrl && logo ? logo : '⚽';

  return (
    <span className={`${fallbackSize} leading-none shrink-0`}>
      {fallbackEmoji}
    </span>
  );
};

export default TeamLogo;
