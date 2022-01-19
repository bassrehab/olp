import { PageHeader } from "antd";
import React from "react";

// displays a page header

export default function Header() {
  return (
    <a href="https://#/" target="_blank" rel="noopener noreferrer">
      <PageHeader
        title="Proof-of-Presence"
        subTitle="Image NFT Service"
        style={{ cursor: "pointer" }}
      />
    </a>
  );
}
