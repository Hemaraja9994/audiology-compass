import type { Metadata, Viewport } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Logo from "@/components/Logo";

const heading = Fraunces({ subsets: ["latin"], variable: "--font-heading", display: "swap", weight: ["500", "600", "700"] });
const body = Source_Sans_3({ subsets: ["latin"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "Audiology Compass: An open web platform for evidence-guided audiology practice",
    template: "%s | Audiology Compass",
  },
  description:
    "Audiology Compass is an open web platform for evidence-guided audiology practice: live ClinicalTrials.gov evidence, audiogram and assessment calculators, ICF aural and vestibular rehabilitation goals, red flags and outcome tracking, with the clinician in charge.",
  applicationName: "Audiology Compass",
  openGraph: {
    title: "Audiology Compass",
    description: "An open web platform for evidence-guided audiology practice.",
    siteName: "Audiology Compass",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2a1035",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${heading.variable} ${body.variable}`}>
      <body className="flex min-h-screen flex-col overflow-x-clip antialiased">
        <Nav />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
        <footer className="no-print mt-8 bg-plum-dark text-stone-200">
          <div className="h-1 bg-gradient-to-r from-amber via-plum-mid to-plum" aria-hidden="true" />
          <div className="mx-auto grid max-w-6xl gap-4 px-4 py-6 text-xs sm:grid-cols-[auto_1fr] sm:items-start">
            <Logo size={40} />
            <div className="space-y-1.5 leading-relaxed">
              <p className="font-semibold text-white">
                Audiology Compass is for educational and research use only. It is not a medical device and does not
                replace clinical judgment. No patient data is stored on the server.
              </p>
              <p>
                Built by Hemaraja Nayaka S, Department of Audiology and Speech-Language Pathology, Yenepoya Medical
                College, Yenepoya (Deemed to be University), Mangaluru, India. Sister tool:{" "}
                <a className="font-semibold text-amber underline underline-offset-2" href="https://slpcompass.vercel.app" target="_blank" rel="noreferrer">
                  SLP Compass
                </a>
                .
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
