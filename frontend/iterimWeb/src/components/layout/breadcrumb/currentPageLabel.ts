export function getCurrentPageLabel(pathname: string): string {
  if (pathname.endsWith('/backlog')) return 'Backlog';
  if (pathname.endsWith('/board')) return 'Board';
  if (pathname.endsWith('/iterations')) return 'Iterations';
  if (pathname.endsWith('/metrics')) return 'Metrics';
  if (pathname.endsWith('/absences')) return 'Absences';
  if (pathname.endsWith('/products')) return 'Products';
  if (pathname.endsWith('/teams')) return 'Teams';
  return 'Overview';
}
