"use client";

import { useState } from "react";

interface NftCardProps {
  imageUrl: string;
  name?: string;
  objectId: string;
}

export function NftCard({ imageUrl, name, objectId }: NftCardProps) {
  const [imgError, setImgError] = useState(false);

  if (imgError) return null;

  return (
    <div className="group bg-white border-[3px] border-black rounded-xl overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px] transition-all duration-200">
      <div className="aspect-video w-full bg-zinc-100 border-b-[3px] border-black relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={name || "Reward NFT"}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={() => setImgError(true)}
        />
      </div>
      <div className="p-4">
        <h3 className="font-black text-lg leading-tight uppercase line-clamp-2">
          {name || "Untitled Milestone"}
        </h3>
        <p className="text-xs text-muted-foreground mt-2 font-mono truncate">
          ID: {objectId}
        </p>
      </div>
    </div>
  );
}
