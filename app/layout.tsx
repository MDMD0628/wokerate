import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Workerate Candidate Intake",
  description: "풀스택 개발자 후보자 데이터를 구조화해서 수집하는 MVP"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
