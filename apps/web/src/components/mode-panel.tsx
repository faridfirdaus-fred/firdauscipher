"use client";

/**
 * mode-panel.tsx — memilih mode TEKS atau FILE, lalu merender panel yang tepat.
 */

import * as React from "react";

import { FilePanel } from "@/components/file-panel";
import { TextPanel } from "@/components/text-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function ModePanel({ slug }: { slug: string }) {
  return (
    <Tabs defaultValue="teks">
      <TabsList>
        <TabsTrigger value="teks">Mode Teks</TabsTrigger>
        <TabsTrigger value="file">Mode File</TabsTrigger>
      </TabsList>
      <TabsContent value="teks">
        <TextPanel slug={slug} />
      </TabsContent>
      <TabsContent value="file">
        <FilePanel slug={slug} />
      </TabsContent>
    </Tabs>
  );
}
