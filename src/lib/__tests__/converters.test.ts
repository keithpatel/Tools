import { describe, it, expect } from "vitest";
import Papa from "papaparse";
import * as yaml from "js-yaml";
import { XMLParser, XMLBuilder } from "fast-xml-parser";

describe("converters roundtrip (JSON<>CSV<>YAML<>XML, Base64, URL)", () => {
  it("CSV -> JSON -> CSV preserves rows", () => {
    const csv = "name,age\nAda,36\nGrace,85";
    const parsed = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: true });
    expect(parsed.errors).toEqual([]);
    expect(parsed.data).toHaveLength(2);
    const back = Papa.unparse(parsed.data);
    expect(back).toContain("Ada");
    expect(back).toContain("Grace");
  });

  it("JSON <> YAML preserves structure", () => {
    const obj = { title: "hello", tags: ["a", "b"], n: 3 };
    const y = yaml.dump(obj);
    const back = yaml.load(y) as typeof obj;
    expect(back).toEqual(obj);
  });

  it("XML parses and rebuilds", () => {
    const xml = `<root><item id="1">hi</item></root>`;
    const parser = new XMLParser({ ignoreAttributes: false });
    const obj = parser.parse(xml);
    expect(obj.root.item["@_id"] ?? obj.root.item.id).toBeDefined();
    const rebuilt = new XMLBuilder({ ignoreAttributes: false }).build(obj);
    expect(rebuilt).toContain("hi");
  });

  it("Base64 UTF-8 roundtrip", () => {
    const text = "Hello ✓ multitool";
    const enc = btoa(String.fromCharCode(...new TextEncoder().encode(text)));
    const dec = new TextDecoder().decode(Uint8Array.from(atob(enc), (c) => c.charCodeAt(0)));
    expect(dec).toBe(text);
  });

  it("URL encode/decode roundtrip", () => {
    const s = "a b&c=d?e#f";
    expect(decodeURIComponent(encodeURIComponent(s))).toBe(s);
  });

  it("slug generator basics", () => {
    const slug = "Hello World! 123"
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/[\s_-]+/g, "-");
    expect(slug).toBe("hello-world-123");
  });
});
