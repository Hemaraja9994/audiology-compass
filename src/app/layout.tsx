import type { Metadata, Viewport } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col antialiased">
        <Nav />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
        <footer className="no-print border-t border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-6xl px-4 py-4 text-xs text-slate-600">
            <p>
              Audiology Compass is for educational and research use only. It is not a medical device and does not
              replace clinical judgment. No patient data is stored on the server.
            </p>
            <p className="mt-1">
              Built by Hemaraja Nayaka S, Department of Audiology and Speech-Language Pathology, Yenepoya Medical
              College, Yenepoya (Deemed to be University), Mangaluru, India. Sister tool: 
              <a className="text-navy underline" href="https://slpcompass.vercel.app" target="_blank" rel="noreferrer">
                SLP Compass
              </a>
              .
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
