import { describe, expect, it } from "vitest";

import { cn } from "./utils";

describe("cn", () => {
  it("menggabungkan className", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("membuang nilai falsy", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });

  it("membiarkan className Tailwind terakhir menang saat konflik", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});
