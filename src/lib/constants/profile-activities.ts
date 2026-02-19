export interface Activity {
  title: string;
  timeAgo: string;
  description: string;
}

export interface Tab {
  id: 'swap' | 'shop' | 'book';
  label: string;
  activeBgClass: string;
  activeTextClass: string;
}

export const SWAP_ACTIVITIES: Activity[] = [
  {
    title: 'ვინტაჟური კამერა გაცვლილი',
    timeAgo: '2 დღის წინ',
    description: 'გაცვლილია @mike_photos-თან'
  },
  {
    title: 'კრემისფერი ქურთუკი გაცვლილი',
    timeAgo: '1 კვირის წინ',
    description: 'გაცვლილია @fashion_lover-თან'
  },
  {
    title: 'სკეიტბორდის დეკი გაცვლილი',
    timeAgo: '2 კვირის წინ',
    description: 'გაცვლილია @skate_daily-თან'
  }
];

export const SHOP_ACTIVITIES: Activity[] = [
  {
    title: 'Nike Air Max განცხადებული',
    timeAgo: '5 დღის წინ',
    description: 'ხელმისაწვდომია გაცვლისთვის'
  },
  {
    title: 'ვინილის ჩანაწერები განცხადებული',
    timeAgo: '1 კვირის წინ',
    description: '5 ნივთი ხელმისაწვდომია'
  },
  {
    title: 'ვინტაჟური პოსტერი გაყიდული',
    timeAgo: '2 კვირის წინ',
    description: 'გაყიდულია @retro_collector-თან'
  }
];

export const BOOK_ACTIVITIES: Activity[] = [
  {
    title: 'ვარცხნილობა დაჯავშნილი',
    timeAgo: '1 კვირის წინ',
    description: 'მომდინარე 15 თებერვალს'
  },
  {
    title: 'მასაჟი დაჯავშნილი',
    timeAgo: '2 კვირის წინ',
    description: 'დასრულებულია 3 თებერვალს'
  },
  {
    title: 'ტატუს სესია დაჯავშნილი',
    timeAgo: '3 კვირის წინ',
    description: 'დასრულებულია 20 იანვარს'
  }
];

export const ACTIVITY_TABS: Tab[] = [
  {
    id: 'swap',
    label: 'გაცვლა',
    activeBgClass: 'bg-swap',
    activeTextClass: 'text-black'
  },
  {
    id: 'shop',
    label: 'მაღაზია',
    activeBgClass: 'bg-primary',
    activeTextClass: 'text-white'
  },
  {
    id: 'book',
    label: 'დაჯავშნა',
    activeBgClass: 'bg-market',
    activeTextClass: 'text-white'
  }
];

