"use client";

type DashboardSectionTabItem<T extends string> = {
  key: T;
  label: string;
};

export function DashboardSectionTabs<T extends string>({
  activeTab,
  items,
  onChange,
}: {
  activeTab: T;
  items: DashboardSectionTabItem<T>[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {items.map((item) => {
        const selected = activeTab === item.key;
        return (
          <button
            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition ${
              selected
                ? "bg-[var(--color-brand)] text-white"
                : "border border-[var(--color-border)] bg-white text-[var(--color-ink)] hover:border-[var(--color-brand)]"
            }`}
            key={item.key}
            onClick={() => onChange(item.key)}
            type="button"
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
