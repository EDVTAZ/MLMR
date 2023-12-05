"use client";
import dynamic from "next/dynamic";

const StyledReader = dynamic(() => import("../Reader"), {
  ssr: false,
});

export default function Page({ params }: { params: { pairing: string } }) {
  return <StyledReader pairingName={decodeURIComponent(params.pairing)} />;
}
