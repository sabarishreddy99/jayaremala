/** LinkedIn post embed (official iframe — no external script needed). Sized by the
 *  shared .gv-embed box so all embeds match exactly. */
export default function GVLinkedInEmbed({
  activityId,
  title = "gradeVITian on LinkedIn",
}: {
  activityId: string;
  title?: string;
}) {
  return (
    <div className="gv-embed">
      <iframe
        src={`https://www.linkedin.com/embed/feed/update/urn:li:activity:${activityId}`}
        title={title}
        loading="lazy"
        allowFullScreen
      />
    </div>
  );
}
