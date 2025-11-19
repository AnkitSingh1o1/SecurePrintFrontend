export type PrintableFile = {
  id?: string;
  name: string;
};

type FileListProps = {
  items: PrintableFile[];
  title?: string;
  onSelect?: (file: PrintableFile) => void;
  emptyLabel?: string;
};

const FileList = ({ items, title, onSelect, emptyLabel }: FileListProps) => (
  <div className="w-full">
    {title ? (
      <div className="mb-3 text-xs uppercase tracking-widest text-brand-gray">
        {title}
      </div>
    ) : null}
    {items.length === 0 ? (
      <p className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-6 text-center text-sm text-gray-500">
        {emptyLabel ?? "No files yet"}
      </p>
    ) : (
      <ul className="space-y-2">
        {items.map((file) => (
          <li
            key={`${file.id ?? file.name}`}
            className={`flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm font-medium text-brand-black shadow-sm transition ${
              onSelect ? "cursor-pointer hover:border-brand-blue hover:text-brand-blue" : ""
            }`}
            onClick={() => (onSelect ? onSelect(file) : undefined)}
          >
            <span className="truncate">{file.name}</span>
            {onSelect ? (
              <svg
                className="h-4 w-4 text-brand-blue"
                viewBox="0 0 24 24"
                stroke="currentColor"
                fill="none"
                strokeWidth="2"
              >
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : null}
          </li>
        ))}
      </ul>
    )}
  </div>
);

export default FileList;
