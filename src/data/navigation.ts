export interface NavItem {
  id: string;
  label: string;
  index: number;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'HOME', index: 0 },
  { id: 'about', label: 'ABOUT', index: 1 },
  { id: 'skills', label: 'SKILLS', index: 2 },
  { id: 'experience', label: 'EXPERIENCE', index: 3 },
  { id: 'projects', label: 'PROJECTS', index: 4 },
  { id: 'contact', label: 'CONTACT', index: 5 },
];
