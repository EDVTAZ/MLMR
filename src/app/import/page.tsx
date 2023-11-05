"use client";
import dynamic from "next/dynamic";

const ConfigurePair = dynamic(() => import("./ConfigurePair"), {
  ssr: false,
});

export default function Page() {
  return <ConfigurePair />;
}
