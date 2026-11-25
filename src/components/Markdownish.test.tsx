import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Markdownish } from "./Markdownish";

describe("Markdownish", () => {
  it("renders bold, italic and code, and never HTML", () => {
    render(<Markdownish text={"**a** *b* `c` <img src=x onerror=alert(1)>"} inline />);
    expect(screen.getByText("a").tagName).toBe("STRONG");
    expect(screen.getByText("b").tagName).toBe("EM");
    expect(screen.getByText("c").tagName).toBe("CODE");
    expect(document.querySelector("img")).toBeNull();
    expect(screen.getByText(/<img src=x/)).toBeInTheDocument();
  });

  it("splits blank-line paragraphs in block mode", () => {
    const { container } = render(<Markdownish text={"First.\n\nSecond."} />);
    expect(container.querySelectorAll("p")).toHaveLength(2);
  });
});
