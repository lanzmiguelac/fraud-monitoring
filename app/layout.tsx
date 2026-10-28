import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'OwnGuard · Fraud Monitoring',description:'An interactive fraud operations UI prototype. Illustrative sample data only.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
