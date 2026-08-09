import { describe, it, expect } from "vitest";
import { markdownLiteToHtml } from "./markdownLite";

describe("markdownLiteToHtml", () => {
  it("renders bold and italic", () => {
    expect(markdownLiteToHtml("**bold** and *italic*")).toBe(
      "<p><strong>bold</strong> and <em>italic</em></p>"
    );
  });

  it("renders a bullet list instead of leaving raw asterisks", () => {
    const out = markdownLiteToHtml("* first point\n* second point");
    expect(out).toBe("<ul><li>first point</li><li>second point</li></ul>");
    expect(out).not.toContain("*");
  });

  it("renders dash bullets too", () => {
    expect(markdownLiteToHtml("- one\n- two")).toBe("<ul><li>one</li><li>two</li></ul>");
  });

  it("separates paragraphs from a preceding list", () => {
    const out = markdownLiteToHtml("1. **Overview**\nSome text.\n* a bullet\nMore text.");
    expect(out).toBe(
      "<p>1. <strong>Overview</strong></p><p>Some text.</p><ul><li>a bullet</li></ul><p>More text.</p>"
    );
  });

  it("escapes HTML in the input", () => {
    expect(markdownLiteToHtml("<script>alert(1)</script>")).toBe(
      "<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>"
    );
  });

  it("skips blank lines", () => {
    expect(markdownLiteToHtml("a\n\nb")).toBe("<p>a</p><p>b</p>");
  });
});
