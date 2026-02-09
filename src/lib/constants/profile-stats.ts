export interface ProfileStat {
  value: string;
  label: string;
  colorClass: string;
}

export const PROFILE_STATS: ProfileStat[] = [
  { value: '24', label: 'დასრულებული გაცვლები', colorClass: 'text-swap' },
  { value: '12', label: 'გაყიდული ნივთები', colorClass: 'text-primary' },
  { value: '4.9★', label: 'რეიტინგი', colorClass: 'text-market' }
];

