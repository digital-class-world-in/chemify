import type { Metadata } from 'next';
import '../globals.css';
import { FirebaseClientProvider } from '@/firebase';
import { Toaster } from "@/components/ui/toaster";
import { AuthCheck } from "@/components/auth/auth-check";
import { ThemeManager } from "@/components/theme-manager";
import { SubscriptionGuard } from "@/components/subscription-guard";
import { DynamicBranding } from "@/components/dynamic-branding";

export const metadata: Metadata = {
  title: 'Institute Management System',
  description: 'Professional Management For Educational Institutes',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@300;400;500;600;700;800;900&family=Poppins:wght@300;400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700;800;900&family=Montserrat:wght@300;400;500;600;700;800;900&family=Playfair+Display:wght@400;500;600;700;800;900&family=Roboto:wght@300;400;500;700;900&family=Open+Sans:wght@300;400;500;600;700;800&family=Lato:wght@300;400;700;900&family=Oswald:wght@300;400;500;600;700&family=Merriweather:wght@300;400;700;900&family=Noto+Sans:wght@300;400;500;600;700;800&family=Nunito:wght@300;400;500;600;700;800&family=Raleway:wght@300;400;500;600;700;800;900&family=Ubuntu:wght@300;400;500;700&family=PT+Sans:wght@400;700&family=Rubik:wght@300;400;500;600;700;800;900&family=Quicksand:wght@300;400;500;600;700&family=Work+Sans:wght@300;400;500;600;700;800;900&family=Fira+Sans:wght@300;400;500;600;700;800;900&family=IBM+Plex+Sans:wght@300;400;500;600;700&family=Josefin+Sans:wght@300;400;500;600;700&family=Karla:wght@300;400;500;600;700;800&family=Libre+Franklin:wght@300;400;500;600;700;800;900&family=Manrope:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@300;400;500;600;700&family=DM+Sans:wght@400;500;700&family=Cabin:wght@400;500;600;700&family=Archivo:wght@300;400;500;600;700;800;900&family=Comfortaa:wght@300;400;500;600;700&family=Kanit:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased selection:bg-primary/30">
        <FirebaseClientProvider>
          <DynamicBranding />
          <ThemeManager />
          <AuthCheck>
            <SubscriptionGuard>
              {children}
            </SubscriptionGuard>
          </AuthCheck>
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}