import type { Metadata } from "next";
import Scene from "./Scene";

export const metadata: Metadata = {
  title: "Living Cluster // Lab",
  description: "Dev-only interactive Living Cluster prototype scene",
};

export default function ClusterPage() {
  return <Scene />;
}
