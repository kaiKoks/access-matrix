import React from 'react';

interface AesLogoProps {
  className?: string;
  showSlogan?: boolean;
  compact?: boolean;
}

export const AesLogo: React.FC<AesLogoProps> = ({
  className = '',
  showSlogan = true,
  compact = false,
}) => {
  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Официальный круглый графический знак АЭС (Брендбук п. 1.2) */}
      <svg
        viewBox="0 0 100 100"
        className="w-9 h-9 shrink-0 drop-shadow-sm"
        aria-label="Логотип АО Алтайэнергосбыт"
      >
        <defs>
          <clipPath id="circle-clip">
            <circle cx="50" cy="50" r="48" />
          </clipPath>
        </defs>

        <g clipPath="url(#circle-clip)">
          {/* Верхне-правая часть (RAO Blue) */}
          <rect width="100" height="100" fill="var(--color-rao-blue)" />

          {/* Нижне-левая часть со стрелкой-молнией (RAO Orange) */}
          <path
            d="M 2 50
               C 2 76.5 23.5 98 50 98
               C 62 98 73 93.5 81.5 86
               L 95 62
               L 66 62
               L 80 40
               L 52 40
               L 60 16
               L 26 50
               Z"
            fill="var(--color-rao-orange)"
          />

          {/* Стрелка-вспышка RAO Blue, врезающаяся в оранжевое поле сверху */}
          <polygon points="60,16 52,40 38,36" fill="var(--color-rao-blue)" />

          {/* Стрелка-вспышка RAO Orange, врезающаяся в синее поле снизу */}
          <polygon points="66,62 95,62 76,74" fill="var(--color-rao-orange)" />

          {/* Буквы АЭС по центру (белый цвет, наклонный жирный шрифт) */}
          <text
            x="49"
            y="58"
            fill="var(--color-rao-white)"
            fontSize="26"
            fontWeight="900"
            fontFamily="'Tahoma', 'Helios', sans-serif"
            fontStyle="italic"
            letterSpacing="-0.5"
            textAnchor="middle"
          >
            АЭС
          </text>
        </g>
      </svg>

      {/* Текстовая часть логотипа (Брендбук п. 1.2) */}
      {!compact && (
        <div className="flex flex-col leading-none">
          <span
            className="text-[15px] font-black tracking-tight text-white italic font-sans"
            style={{ fontFamily: "'Tahoma', 'Helios', sans-serif" }}
          >
            АЛТАЙЭНЕРГОСБЫТ
          </span>
          {showSlogan && (
            <span
              className="text-[9.5px] font-black tracking-wider text-rao-orange italic mt-0.5"
              style={{ fontFamily: "'Tahoma', 'Helios', sans-serif" }}
            >
              НАПОЛНЯЯ ЖИЗНЬ СВЕТОМ!
            </span>
          )}
        </div>
      )}
    </div>
  );
};
