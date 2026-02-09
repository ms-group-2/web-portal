export interface Activity {
  title: string;
  timeAgo: string;
  description: string;
}

export const RECENT_ACTIVITIES: Activity[] = [
  {
    title: 'ვინტაჟური კამერა გაცვლილი',
    timeAgo: '2 დღის წინ',
    description: 'გაცვლილია @mike_photos-თან'
  },
  {
    title: 'Nike Air Max განცხადებული',
    timeAgo: '5 დღის წინ',
    description: 'ხელმისაწვდომია გაცვლისთვის'
  },
  {
    title: 'ვარცხნილობა დაჯავშნილი',
    timeAgo: '1 კვირის წინ',
    description: 'მომდინარე 15 თებერვალს'
  }
];

