"use client";

import { StyledReader } from "../Reader";

export default function Page({ params }: { params: { collections: string } }) {
  return (
    <StyledReader
      collectionNames={decodeURIComponent(params.collections).split(";")}
    />
  );
}
