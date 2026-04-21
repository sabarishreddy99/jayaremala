export interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  message: Message;
  streaming?: boolean;
}

// Matches **bold**, *italic*, URLs, and newlines in one pass
const INLINE = /(\*\*(.+?)\*\*|\*(.+?)\*|https?:\/\/[^\s]+|\n)/g;

function renderContent(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  INLINE.lastIndex = 0;

  while ((match = INLINE.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));

    const raw = match[0];
    if (raw === "\n") {
      nodes.push(<br key={match.index} />);
    } else if (raw.startsWith("**")) {
      nodes.push(<strong key={match.index} className="font-semibold text-zinc-900">{match[2]}</strong>);
    } else if (raw.startsWith("*")) {
      nodes.push(<em key={match.index}>{match[3]}</em>);
    } else {
      nodes.push(
        <a key={match.index} href={raw} target="_blank" rel="noopener noreferrer"
          className="underline underline-offset-2 text-indigo-600 hover:text-indigo-800 break-all transition-colors">
          {raw}
        </a>
      );
    }
    last = match.index + raw.length;
  }

  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export default function ChatMessage({ message, streaming }: Props) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] sm:max-w-[70%] rounded-2xl rounded-tr-sm bg-zinc-950 px-4 py-2.5 text-sm leading-relaxed text-white shadow-sm">
          {renderContent(message.content)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start gap-3">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-base mt-0.5" title="Avocado">
        🥑
      </div>
      <div className="max-w-[80%] sm:max-w-[75%] rounded-2xl rounded-tl-sm border border-zinc-200 bg-white px-4 py-2.5 text-sm leading-relaxed text-zinc-800 shadow-sm">
        {streaming && !message.content ? (
          <span className="inline-flex gap-1 items-center h-4">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:0ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:300ms]" />
          </span>
        ) : (
          <>
            {renderContent(message.content)}
            {streaming && <span className="cursor-blink ml-0.5 text-zinc-400">|</span>}
          </>
        )}
      </div>
    </div>
  );
}
