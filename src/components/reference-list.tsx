import type { Reference } from "@/data";

export function ReferenceList({ entries }: { entries: readonly Reference[] }) {
  return (
    <ul className="reference-list" role="list">
      {entries.map((reference) => (
        <li key={reference.id}>
          <a href={reference.url} lang="en">{reference.title}</a>
          <p>{reference.authors}. <cite lang="en">{reference.publication}</cite>, {reference.year}.</p>
        </li>
      ))}
    </ul>
  );
}
