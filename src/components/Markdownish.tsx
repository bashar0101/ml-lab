import { Fragment, type ReactNode } from "react";

const TOKEN = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;

function renderInline(text: string): ReactNode[] {
  return text.split(TOKEN).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) return <code key={i}>{part.slice(1, -1)}</code>;
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) return <em key={i}>{part.slice(1, -1)}</em>;
    return <Fragment key={i}>{part}</Fragment>;
  });
}

/**
 * Renders the tiny Markdown subset used in content files: **bold**, *italic*, `code`,
 * and blank-line paragraphs (block mode). Everything else is plain text.
 */
export function Markdownish({ text, inline = false }: { text: string; inline?: boolean }) {
  if (inline) return <>{renderInline(text)}</>;
  return (
    <>
      {text
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p, i) => (
          <p key={i}>{renderInline(p)}</p>
        ))}
    </>
  );
}
