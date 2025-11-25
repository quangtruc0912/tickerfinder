import React from 'react';

interface CountryFlagProps {
  countryCode: string;
  className?: string;
  style?: React.CSSProperties;
}

const CountryFlag: React.FC<CountryFlagProps> = ({ countryCode, className, style }) => {
  // Convert ISO 3166-1 alpha-2 country code to flag emoji
  const countryCodeToFlag = (code: string): string => {
    return code.toUpperCase().replace(/./g, char => String.fromCodePoint(127397 + char.charCodeAt(0)));
  };

  const flagEmoji = countryCodeToFlag(countryCode);

  const defaultStyle: React.CSSProperties = {
    fontSize: '14px',
    marginLeft: '4px',
    display: 'inline-block',
    ...style,
  };

  return (
    <span className={className} style={defaultStyle} title={`Country: ${countryCode}`} data-country-flag="true">
      {flagEmoji}
    </span>
  );
};

export default CountryFlag;
