import { Fragment, type ReactNode } from "react";

const TOKEN = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;

type CodeRenderer = (text: string) => ReactNode;
const plainCode: CodeRenderer = (s) => s;

function renderInline(text: string, code: CodeRenderer): ReactNode[] {
  return text.split(TOKEN).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) return <code key={i}>{code(part.slice(1, -1))}</code>;
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) return <em key={i}>{part.slice(1, -1)}</em>;
    return <Fragment key={i}>{part}</Fragment>;
  });
}

/**
 * Renders the tiny Markdown subset used in content files: **bold**, *italic*, `code`,
 * and blank-line paragraphs (block mode). Everything else is plain text.
 * `code` optionally renders what is inside backticks (e.g. to draw maths notation).
 */
export function Markdownish({ text, inline = false, code = plainCode }: { text: string; inline?: boolean; code?: CodeRenderer }) {
  if (inline) return <>{renderInline(text, code)}</>;
  return (
    <>
      {text
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p, i) => (
          <p key={i}>{renderInline(p, code)}</p>
        ))}
    </>
  );
}
