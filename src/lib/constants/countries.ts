export interface Country {
  name: string;
  nameGeo: string;
  code: string;
  flag: string;
  dialCode: string;
}

export const COUNTRIES: Country[] = [
  { name: 'Georgia', nameGeo: 'საქართველო', code: 'GE', flag: '🇬🇪 ', dialCode: '+995' },
  { name: 'United States', nameGeo: 'აშშ', code: 'US', flag: '🇺🇸 ', dialCode: '+1' },
  { name: 'United Kingdom', nameGeo: 'დიდი ბრიტანეთი', code: 'GB', flag: '🇬🇧 ', dialCode: '+44' },
  { name: 'Germany', nameGeo: 'გერმანია', code: 'DE', flag: '🇩🇪 ', dialCode: '+49' },
  { name: 'France', nameGeo: 'საფრანგეთი', code: 'FR', flag: '🇫🇷 ', dialCode: '+33' },
  { name: 'Italy', nameGeo: 'იტალია', code: 'IT', flag: '🇮🇹 ', dialCode: '+39' },
  { name: 'Spain', nameGeo: 'ესპანეთი', code: 'ES', flag: '🇪🇸 ', dialCode: '+34' },
  { name: 'Russia', nameGeo: 'რუსეთი', code: 'RU', flag: '🇷🇺 ', dialCode: '+7' },
  { name: 'Turkey', nameGeo: 'თურქეთი', code: 'TR', flag: '🇹🇷 ', dialCode: '+90' },
  { name: 'Ukraine', nameGeo: 'უკრაინა', code: 'UA', flag: '🇺🇦', dialCode: '+380' },
  { name: 'Poland', nameGeo: 'პოლონეთი', code: 'PL', flag: '🇵🇱', dialCode: '+48' },
  { name: 'Netherlands', nameGeo: 'ნიდერლანდები', code: 'NL', flag: '🇳🇱 ', dialCode: '+31' },
  { name: 'Belgium', nameGeo: 'ბელგია', code: 'BE', flag: '🇧🇪 ', dialCode: '+32' },
  { name: 'Greece', nameGeo: 'საბერძნეთი', code: 'GR', flag: '🇬🇷 ', dialCode: '+30' },
  { name: 'Armenia', nameGeo: 'სომხეთი', code: 'AM', flag: '🇦🇲 ', dialCode: '+374' },
  { name: 'Azerbaijan', nameGeo: 'აზერბაიჯანი', code: 'AZ', flag: '🇦🇿 ', dialCode: '+994' },
  { name: 'Canada', nameGeo: 'კანადა', code: 'CA', flag: '🇨🇦 ', dialCode: '+1' },
  { name: 'Australia', nameGeo: 'ავსტრალია', code: 'AU', flag: '🇦🇺 ', dialCode: '+61' },
  { name: 'China', nameGeo: 'ჩინეთი', code: 'CN', flag:'🇨🇳 ', dialCode:'+86' },
  { name: 'Japan', nameGeo: 'იაპონია', code: 'JP', flag: '🇯🇵 ', dialCode: '+81' },
  { name: 'South Korea', nameGeo: 'სამხრეთ კორეა', code: 'KR', flag: '🇰🇷 ', dialCode: '+82' },
  { name: 'India', nameGeo: 'ინდოეთი', code: 'IN', flag: '🇮🇳 ', dialCode: '+91' },
  { name: 'Brazil', nameGeo: 'ბრაზილია', code: 'BR', flag: '🇧🇷 ', dialCode: '+55' },
  { name: 'Mexico', nameGeo: 'მექსიკა', code: 'MX', flag: '🇲🇽 ', dialCode: '+52' },
  { name: 'Israel', nameGeo: 'ისრაელი', code: 'IL', flag: '🇮🇱 ', dialCode: '+972' },
  { name: 'UAE', nameGeo: 'არაბეთი', code: 'AE', flag: '🇦🇪 ', dialCode: '+971' },
];
