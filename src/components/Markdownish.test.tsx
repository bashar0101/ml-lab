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

  it("lets the caller render what is inside `code`", () => {
    render(<Markdownish text={"see `a+b` here"} code={(s) => <b>{s.toUpperCase()}</b>} />);
    expect(screen.getByText("A+B").tagName).toBe("B");
    expect(screen.getByText("A+B").parentElement?.tagName).toBe("CODE");
  });

  it("splits blank-line paragraphs in block mode", () => {
    const { container } = render(<Markdownish text={"First.\n\nSecond."} />);
    expect(container.querySelectorAll("p")).toHaveLength(2);
  });
});
