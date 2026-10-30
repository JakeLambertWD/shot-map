import { createTheme } from "@mantine/core";
import { Bodoni_Moda, Lato, Poppins } from "next/font/google";

export const DEFAULT_BLACK = "#181818";
export const PRIMARY_COLOR = "#e7ba3d";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const lato = Lato({
  subsets: ["latin"],
  weight: ["100", "300", "400", "700", "900"],
});

// Display serif for the hero. 400 is the lightest static weight
// next/font/google ships for Bodoni Moda.
const bodoniModa = Bodoni_Moda({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const theme = createTheme({
  fontFamily: lato.style.fontFamily,
  // Falls back to the Geist Mono loaded in app/layout.tsx (--font-geist-mono).
  fontFamilyMonospace: "var(--font-geist-mono), ui-monospace, SFMono-Regular, monospace",
  cursorType: "pointer",
  defaultRadius: "xs",
  radius: {
    xs: "4px",
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "20px",
    xxl: "24px",
    xxxl: "32px",
  },
  fontSizes: {
    xxs: "0.625rem", // 10px
    xs: "0.75rem", // 12px
    sm: "0.875rem", // 14px
    md: "1rem", // 16px
    lg: "1.125rem", // 18px
    xl: "1.25rem", // 20px
    tableFontSize: "0.8rem", // 12.8px
  },
  spacing: {
    xxs: "0.25rem", // 4px
    xs: "0.375rem", // 6px
    sm: "0.5rem", // 8px
    md: "1rem", // 16px
    lg: "1.5rem", // 24px
    xl: "2rem", // 32px
    xxl: "3rem", // 48px
    xxxl: "4rem", // 64px
  },
  breakpoints: {
    xxs: "20rem", // 320px
    xs: "30rem", // 480px
    sm: "48rem", // 768px
    md: "64rem", // 1024px
    lg: "80rem", // 1280px
    xl: "90rem", // 1440px
  },
  headings: {
    fontFamily: poppins.style.fontFamily,
    fontWeight: "600",
    sizes: {
      h1: {
        fontSize: "2.125rem",
        lineHeight: "44.2px",
      },
      h2: {
        fontSize: "1.625rem",
        lineHeight: "35.1px",
      },
      h3: {
        fontSize: "1.375rem",
        lineHeight: "30.8px",
      },
      h4: {
        fontSize: "1.125rem",
        lineHeight: "26.1px",
      },
      h5: {
        fontSize: "1rem",
        lineHeight: "24px",
      },
      h6: {
        fontSize: "0.875rem",
        lineHeight: "21px",
      },
    },
  },
  // COLORS
  black: DEFAULT_BLACK,
  primaryColor: "yellow",
  primaryShade: 5,
  colors: {
    yellow: [
      "#fff8e1",
      "#ffefb3",
      "#fce28a",
      "#f4d05f",
      "#edc34b",
      PRIMARY_COLOR,
      "#c99d24",
      "#a77f14",
      "#805f0b",
      "#5b4205",
    ],
    brown: [
      "#f2ece4",
      "#a89a8c",
      "#665b52",
      "#4d433b",
      "#332c26",
      "#2a211d",
      "#221d19",
      "#1b1815",
      "#1a1210",
      "#141110",
    ],
  },
  other: {
    colors: {
      teal: "#5eb8b0",
      amber: "#d97706",
    },
    fonts: {
      display: bodoniModa.style.fontFamily,
    },
  },
});
