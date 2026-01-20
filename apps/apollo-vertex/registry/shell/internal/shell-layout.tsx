import { rgba } from "framer-motion";
import type { PropsWithChildren } from "react";
import { Sidebar } from "./sidebar";

interface ShellLayoutProps {
  companyName: string;
  productName: string;
}

function GradientBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-80">
        {/* ellipse 1 */}
        <svg xmlns="http://www.w3.org/2000/svg" width="860" height="810" viewBox="0 0 860 810" fill="none" style={{fill: 'rgba(31, 89, 117, 0.60)', filter: 'blur(149.64300537109375px)'}}>
          <g filter="url(#filter0_f_7_1009)">
            <path d="M982.367 261.066C814.77 99.1405 593.043 79.8921 415.707 263.441C238.37 446.989 273.041 774.678 455.964 771.18C623.562 933.105 518.181 741.512 695.518 557.964C872.854 374.415 1149.96 422.991 982.367 261.066Z" fill="#1F5975" fill-opacity="0.6"/>
          </g>
          <defs>
            <filter id="filter0_f_7_1009" x="0.00012207" y="-166.663" width="1333.5" height="1298.11" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
              <feFlood flood-opacity="0" result="BackgroundImageFix"/>
              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
              <feGaussianBlur stdDeviation="149.643" result="effect1_foregroundBlur_7_1009"/>
            </filter>
          </defs>
        </svg>

        {/* Ellipse 2 */}
        <div style={{
          width: '758.989px',
          height: '710.505px',
          borderRadius: '758.989px',
          background: 'rgba(152, 166, 184, 0.15)',
          filter: 'blur(149.64300537109375px)',
        }} />

        {/* ellipse 3 */}
        <svg xmlns="http://www.w3.org/2000/svg" width="895" height="810" viewBox="0 0 895 810" fill="none" style={{
          fill: 'rgba(87, 194, 214, 0.11)',
          filter: 'blur(149.64300537109375px)',
        }}>
          <g filter="url(#filter0_f_7_1011)">
            <path d="M524.312 547.394C291.767 608.448 234.593 867.63 375.567 867.63C516.54 867.63 1012.15 928.119 1012.15 745.821C1012.15 563.523 1092.67 223.267 951.693 223.267C810.719 223.267 608.112 383.385 524.312 547.394Z" fill="#57C2D6" fill-opacity="0.11"/>
          </g>
          <defs>
            <filter id="filter0_f_7_1011" x="0.00012207" y="-76.0187" width="1334.33" height="1252.56" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
              <feFlood flood-opacity="0" result="BackgroundImageFix"/>
              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
              <feGaussianBlur stdDeviation="149.643" result="effect1_foregroundBlur_7_1011"/>
            </filter>
          </defs>
        </svg>

        {/* Ellipse 4 */}
        <div style={{
          width: '798px',
          height: '346px',
          borderRadius: '798px',
          background: 'rgba(199, 240, 254, 0.25)',
          filter: 'blur(149.64300537109375px)',
        }} />
    </div>
  );
}

export function ShellLayout({
  children,
  companyName,
  productName,
}: PropsWithChildren<ShellLayoutProps>) {
  return (
    <div className="relative h-screen overflow-hidden flex bg-sidebar">
      <Sidebar companyName={companyName} productName={productName} />
      <main className="relative flex-1 flex flex-col overflow-hidden bg-sidebar">
        <GradientBackground />
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
}
