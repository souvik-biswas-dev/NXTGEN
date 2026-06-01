// All platform_data blobs + city centroids, ported from the old Supabase
// migrations (003, 012, 013). Kept in TS so the seed is self-contained.

export const platformDataSeed: Record<string, unknown> = {
  popular_cities: [
    { id: '1', name: 'Mumbai', properties: 2500 },
    { id: '2', name: 'Delhi', properties: 1800 },
    { id: '3', name: 'Bangalore', properties: 2100 },
    { id: '4', name: 'Hyderabad', properties: 1500 },
    { id: '5', name: 'Pune', properties: 1200 },
    { id: '6', name: 'Chennai', properties: 950 },
    { id: '7', name: 'Noida', properties: 800 },
    { id: '8', name: 'Gurgaon', properties: 1100 },
    { id: '9', name: 'Kolkata', properties: 750 },
    { id: '10', name: 'Ahmedabad', properties: 600 },
  ],
  popular_localities: {
    Mumbai: ['Bandra', 'Andheri', 'Powai', 'Juhu', 'Worli', 'Lower Parel', 'Malad'],
    Delhi: ['Connaught Place', 'Dwarka', 'Saket', 'Vasant Kunj', 'Defence Colony', 'Greater Kailash'],
    Bangalore: ['Whitefield', 'Koramangala', 'Indiranagar', 'HSR Layout', 'Electronic City', 'Marathahalli'],
    Hyderabad: ['Jubilee Hills', 'Banjara Hills', 'Gachibowli', 'HITEC City', 'Kondapur', 'Madhapur'],
    Noida: ['Sector 150', 'Sector 137', 'Sector 62', 'Sector 44', 'Sector 76', 'Sector 128'],
    Gurgaon: ['DLF Phase 1', 'DLF Phase 3', 'Golf Course Road', 'Sohna Road', 'Sector 56', 'MG Road'],
    Pune: ['Kothrud', 'Baner', 'Hinjewadi', 'Wakad', 'Koregaon Park', 'Viman Nagar'],
    Chennai: ['Adyar', 'Anna Nagar', 'T Nagar', 'Velachery', 'OMR', 'ECR'],
  },
  amenities: [
    'Swimming Pool', 'Gym', 'Clubhouse', 'Power Backup', '24x7 Security', 'Garden', 'Play Area',
    'Jogging Track', 'Indoor Games', 'Home Theater', 'Smart Home', 'EV Charging', 'Concierge',
    'Private Pool', 'Solar Power', 'Lift', 'Covered Parking', 'Water Purifier', 'Conference Room', 'Cafeteria',
  ],
  price_ranges: {
    buy: [
      { label: 'Under ₹50 Lakh', min: 0, max: 5000000 },
      { label: '₹50 Lakh - ₹1 Cr', min: 5000000, max: 10000000 },
      { label: '₹1 Cr - ₹2 Cr', min: 10000000, max: 20000000 },
      { label: '₹2 Cr - ₹5 Cr', min: 20000000, max: 50000000 },
      { label: 'Above ₹5 Cr', min: 50000000, max: null },
    ],
    rent: [
      { label: 'Under ₹15K', min: 0, max: 15000 },
      { label: '₹15K - ₹30K', min: 15000, max: 30000 },
      { label: '₹30K - ₹50K', min: 30000, max: 50000 },
      { label: '₹50K - ₹1 Lakh', min: 50000, max: 100000 },
      { label: 'Above ₹1 Lakh', min: 100000, max: null },
    ],
  },
  market_trends: [
    { city: 'Mumbai', trend: 'up', change: '+8.5%', avgPrice: '18,500', period: 'YoY' },
    { city: 'Bangalore', trend: 'up', change: '+12.3%', avgPrice: '12,200', period: 'YoY' },
    { city: 'Hyderabad', trend: 'up', change: '+15.7%', avgPrice: '8,800', period: 'YoY' },
    { city: 'Pune', trend: 'up', change: '+9.2%', avgPrice: '9,500', period: 'YoY' },
    { city: 'Delhi NCR', trend: 'up', change: '+6.8%', avgPrice: '14,200', period: 'YoY' },
    { city: 'Chennai', trend: 'up', change: '+7.5%', avgPrice: '7,800', period: 'YoY' },
  ],
  new_launches: [
    { id: 'nl1', name: 'DLF The Camellias', developer: 'DLF Ltd', location: 'Golf Course Road, Gurgaon', priceRange: '₹8 Cr - ₹25 Cr', image: 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800', launchDate: 'Feb 2026' },
    { id: 'nl2', name: 'Godrej Reserve', developer: 'Godrej Properties', location: 'Chandivali, Mumbai', priceRange: '₹2.5 Cr - ₹6 Cr', image: 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=800', launchDate: 'March 2026' },
    { id: 'nl3', name: 'Prestige Lakeside Habitat', developer: 'Prestige Group', location: 'Whitefield, Bangalore', priceRange: '₹1.2 Cr - ₹3 Cr', image: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800', launchDate: 'Jan 2026' },
  ],
  subscription_plans: [
    { plan: 'free', name: 'Free', price: 0, maxListings: 3, features: ['3 listings', 'Basic search', 'Email support'] },
    { plan: 'silver', name: 'Silver', price: 999, maxListings: 10, features: ['10 listings', 'Priority support', 'Analytics dashboard', 'Verified badge'] },
    { plan: 'gold', name: 'Gold', price: 2499, maxListings: null, features: ['Unlimited listings', 'Featured placement', 'Dedicated manager', 'Premium badge', 'Top search ranking'] },
  ],
  home_loan_partners: [
    { id: 'sbi', name: 'SBI Home Loans', interest: '8.40%', processingFee: '0.35%', maxTenure: 30 },
    { id: 'hdfc', name: 'HDFC Home Loans', interest: '8.50%', processingFee: '0.50%', maxTenure: 30 },
    { id: 'icici', name: 'ICICI Home Loans', interest: '8.55%', processingFee: '0.50%', maxTenure: 30 },
    { id: 'axis', name: 'Axis Home Loans', interest: '8.60%', processingFee: '0.50%', maxTenure: 30 },
    { id: 'lichfl', name: 'LIC Housing Finance', interest: '8.35%', processingFee: '0.25%', maxTenure: 30 },
  ],
  report_reasons: [
    { id: 'spam', label: 'Spam / Fake Listing' },
    { id: 'duplicate', label: 'Duplicate Listing' },
    { id: 'misleading', label: 'Misleading Information' },
    { id: 'sold_or_rented', label: 'Already Sold / Rented' },
    { id: 'inappropriate', label: 'Inappropriate Content' },
    { id: 'fraud', label: 'Suspected Fraud' },
    { id: 'other', label: 'Other' },
  ],
  support: {
    email: 'support@nxtgenproperties.com',
    bugs_email: 'bugs@nxtgenproperties.com',
    whatsapp: '+911234567890',
    phone: '+911234567890',
    hours: 'Mon–Sat, 9 AM–7 PM',
  },
  legal_links: [
    { label: 'Privacy Policy', url: 'https://nxtgenproperties.com/privacy' },
    { label: 'Terms of Service', url: 'https://nxtgenproperties.com/terms' },
    { label: 'Cookie Policy', url: 'https://nxtgenproperties.com/cookies' },
    { label: 'RERA Compliance', url: 'https://nxtgenproperties.com/rera' },
    { label: 'Refund Policy', url: 'https://nxtgenproperties.com/refund' },
  ],
  social_links: [
    { icon: 'logo-instagram', label: 'Instagram', url: 'https://instagram.com/nxtgenproperties', color: '#E1306C' },
    { icon: 'logo-linkedin', label: 'LinkedIn', url: 'https://linkedin.com/company/nxtgenproperties', color: '#0A66C2' },
    { icon: 'logo-twitter', label: 'Twitter / X', url: 'https://twitter.com/nxtgenprops', color: '#1DA1F2' },
    { icon: 'logo-youtube', label: 'YouTube', url: 'https://youtube.com/@nxtgenproperties', color: '#FF0000' },
  ],
  about_features: [
    { icon: 'search-outline', title: 'Smart Search', description: 'Filter by location, price, type, BHK, and more to find the perfect property.' },
    { icon: 'shield-checkmark-outline', title: 'Verified Listings', description: 'RERA-verified brokers and owner-posted listings for a trustworthy experience.' },
    { icon: 'chatbubbles-outline', title: 'Direct Chat', description: 'Connect directly with owners and brokers without middlemen.' },
    { icon: 'calculator-outline', title: 'Financial Tools', description: 'Built-in EMI and budget calculators to plan your investment.' },
    { icon: 'trending-up-outline', title: 'Market Insights', description: 'Stay informed with real-time price trends and locality reports.' },
    { icon: 'git-compare-outline', title: 'Compare Properties', description: 'Side-by-side comparison of shortlisted properties.' },
  ],
  faqs: [
    { category: 'Listings & Search', items: [
      { q: 'How do I search for properties?', a: 'Use the Search tab to filter properties by location, price, type, and BHK.' },
      { q: 'How do I save a property to my favorites?', a: 'Tap the heart icon on any property card or detail page to save it.' },
    ]},
    { category: 'Account & Profile', items: [
      { q: 'How do I become a verified broker?', a: 'Go to your Profile and tap Request Verification. Submit your RERA number, ID, and address proof.' },
    ]},
    { category: 'Payments & Subscription', items: [
      { q: 'What plans are available?', a: 'We offer Free, Silver, and Gold plans. Paid plans unlock unlimited listings and analytics.' },
    ]},
  ],
};

export const cityCentroidsSeed: { city: string; latitude: number; longitude: number }[] = [
  { city: 'Mumbai', latitude: 19.076, longitude: 72.8777 },
  { city: 'Delhi', latitude: 28.6139, longitude: 77.209 },
  { city: 'New Delhi', latitude: 28.6139, longitude: 77.209 },
  { city: 'Bengaluru', latitude: 12.9716, longitude: 77.5946 },
  { city: 'Bangalore', latitude: 12.9716, longitude: 77.5946 },
  { city: 'Hyderabad', latitude: 17.385, longitude: 78.4867 },
  { city: 'Chennai', latitude: 13.0827, longitude: 80.2707 },
  { city: 'Kolkata', latitude: 22.5726, longitude: 88.3639 },
  { city: 'Pune', latitude: 18.5204, longitude: 73.8567 },
  { city: 'Ahmedabad', latitude: 23.0225, longitude: 72.5714 },
  { city: 'Gurgaon', latitude: 28.4595, longitude: 77.0266 },
  { city: 'Gurugram', latitude: 28.4595, longitude: 77.0266 },
  { city: 'Noida', latitude: 28.5355, longitude: 77.391 },
  { city: 'Greater Noida', latitude: 28.4744, longitude: 77.504 },
];
