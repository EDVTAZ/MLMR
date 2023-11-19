"use client";

import { StyledReader } from "../Reader";

export default function Page({ params }: { params: { pairing: string } }) {
  return <StyledReader pairingName={decodeURIComponent(params.pairing)} />;
}
