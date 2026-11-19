import type { SVGProps } from 'react';

export type AppIconName =
  | 'dashboard' | 'products' | 'people' | 'truck' | 'inventory' | 'sales'
  | 'reports' | 'settings' | 'chevron' | 'logout' | 'search' | 'menu'
  | 'package' | 'arrow' | 'warehouse' | 'check' | 'shield';

const paths: Record<AppIconName, string> = {
  dashboard: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  products: 'M21 8l-9 5-9-5 M3 8l9-5 9 5v8l-9 5-9-5z M12 13v8',
  people: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',
  truck: 'M10 17h4V5H2v12h3 M14 9h4l4 4v4h-3 M7.5 20a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5 M16.5 20a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5',
  inventory: 'M4 7h16v14H4z M4 7l3-4h10l3 4 M9 12h6 M12 7v14',
  sales: 'M3 3h2l3 12h11l3-9H6 M9 21h.01 M18 21h.01',
  reports: 'M3 3v18h18 M8 16v-5 M13 16V7 M18 16v-8',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6 M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06-2 2-.06-.06A1.65 1.65 0 0 0 16 18.5h-8a1.65 1.65 0 0 0-1.73.32l-.06.06-2-2 .06-.06A1.65 1.65 0 0 0 4.6 15v-6a1.65 1.65 0 0 0-.33-1.82l-.06-.06 2-2 .06.06A1.65 1.65 0 0 0 8 5.5h8a1.65 1.65 0 0 0 1.73-.32l.06-.06 2 2-.06.06A1.65 1.65 0 0 0 19.4 9z',
  chevron: 'M6 9l6 6 6-6',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16 M21 21l-4.35-4.35',
  menu: 'M3 6h18 M3 12h18 M3 18h18',
  package: 'M3 7l9-4 9 4v10l-9 4-9-4z M3 7l9 4 9-4 M12 11v10',
  arrow: 'M5 12h14 M13 6l6 6-6 6',
  warehouse: 'M3 21V9l9-6 9 6v12 M3 21h18 M8 21v-9h8v9',
  check: 'M20 6L9 17l-5-5',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10 M9 12l2 2 4-4',
};

export function AppIcon({ name, size = 19, ...props }: SVGProps<SVGSVGElement> & { name: AppIconName; size?: number }) {
  return (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" width={size} height={size}
      viewBox="0 0 24 24" {...props}>
      <path d={paths[name]} />
    </svg>
  );
}
