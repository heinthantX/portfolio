import type { Metadata } from "next";
import { BlueprintScene } from "./BlueprintScene";

export const metadata: Metadata = { title: "Blueprint // Lab" };

export default function BlueprintPage() {
  return <BlueprintScene />;
}
