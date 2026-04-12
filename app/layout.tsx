import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "NN-VAULT | SYSTEM v3.0",
  description: "Enterprise Quant & Fintech Solutions",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-[#050505] text-[#00ff41] min-h-screen`}>
        {/* This is the Master Frame. 
           The 'bg-[#050505]' forces the background to be black 
           The 'text-[#00ff41]' forces the neon green 
        */}
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
