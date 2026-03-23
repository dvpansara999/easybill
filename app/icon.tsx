import { ImageResponse } from "next/og"

export const size = {
  width: 512,
  height: 512,
}

export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
        }}
      >
        <svg width="512" height="512" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="easybill-icon-gradient" x1="10" y1="6" x2="56" y2="58" gradientUnits="userSpaceOnUse">
              <stop stopColor="#3b4046" />
              <stop offset="1" stopColor="#2a2f35" />
            </linearGradient>
          </defs>
          <rect x="6" y="6" width="52" height="52" rx="16" fill="url(#easybill-icon-gradient)" />
          <g fill="#ffffff" transform="translate(1 1)">
            <path d="M18.6 33.2c0-7.2 5.3-12.6 13-12.6 6.6 0 11.2 4.2 12.2 10.2.1.7-.3 1.3-1.1 1.3H25.9c.8 3.4 3.5 5.4 6.9 5.4 2.2 0 3.9-.7 5.3-1.9.5-.4 1.2-.4 1.6.1l2.3 2.3c.5.5.5 1.2 0 1.7-2.4 2.4-5.9 3.8-9.8 3.8-8.1 0-13.7-5.4-13.7-13.5Zm7.3-3.5h10.5c-.7-2.7-3-4.5-5.3-4.5-2.6 0-4.7 1.6-5.2 4.5Z" />
            <path d="M39.1 17.8h10.6c5.1 0 8.4 3 8.4 7.2 0 2.9-1.6 5.1-4.3 6 3.2.9 5.2 3.3 5.2 6.6 0 4.6-3.6 7.7-9 7.7H39.1c-.7 0-1.3-.6-1.3-1.3V19.1c0-.7.6-1.3 1.3-1.3Zm9.8 10.7c2.1 0 3.4-1.1 3.4-2.8 0-1.6-1.3-2.7-3.4-2.7h-4.3v5.4h4.3Zm.7 11.4c2.3 0 3.7-1.2 3.7-3 0-1.8-1.4-3-3.7-3h-5v6h5Z" />
          </g>
        </svg>
      </div>
    ),
    size
  )
}
