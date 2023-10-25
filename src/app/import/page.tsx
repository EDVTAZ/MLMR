"use client";
import dynamic from "next/dynamic";

const StyledImport = dynamic(() => import("./Import"), {
  ssr: false,
});

export default function Page() {
  return <StyledImport />;
}
