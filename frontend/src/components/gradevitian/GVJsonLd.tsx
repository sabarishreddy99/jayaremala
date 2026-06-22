/** Renders one or more JSON-LD blocks. Server component — emitted into the static
 *  HTML so crawlers see the structured data without running JS. */
export default function GVJsonLd({ data }: { data: object | object[] }) {
  const items = Array.isArray(data) ? data : [data];
  return (
    <>
      {items.map((d, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(d) }}
        />
      ))}
    </>
  );
}
