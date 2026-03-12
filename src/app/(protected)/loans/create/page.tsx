'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { db, auth } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp, doc, onSnapshot } from 'firebase/firestore';
import { Loader2, ArrowRight, ArrowLeft, Upload } from 'lucide-react';

// Comprehensive global country calling codes (Tanzania at top – full list preserved)
const countryCodes = [
  { label: 'Tanzania (+255)', value: '+255' },
  { label: 'Afghanistan (+93)', value: '+93' },
  { label: 'Albania (+355)', value: '+355' },
  { label: 'Algeria (+213)', value: '+213' },
  { label: 'American Samoa (+1)', value: '+1' },
  { label: 'Andorra (+376)', value: '+376' },
  { label: 'Angola (+244)', value: '+244' },
  { label: 'Anguilla (+1)', value: '+1' },
  { label: 'Antigua and Barbuda (+1)', value: '+1' },
  { label: 'Argentina (+54)', value: '+54' },
  { label: 'Armenia (+374)', value: '+374' },
  { label: 'Aruba (+297)', value: '+297' },
  { label: 'Australia (+61)', value: '+61' },
  { label: 'Austria (+43)', value: '+43' },
  { label: 'Azerbaijan (+994)', value: '+994' },
  { label: 'Bahamas (+1)', value: '+1' },
  { label: 'Bahrain (+973)', value: '+973' },
  { label: 'Bangladesh (+880)', value: '+880' },
  { label: 'Barbados (+1)', value: '+1' },
  { label: 'Belarus (+375)', value: '+375' },
  { label: 'Belgium (+32)', value: '+32' },
  { label: 'Belize (+501)', value: '+501' },
  { label: 'Benin (+229)', value: '+229' },
  { label: 'Bermuda (+1)', value: '+1' },
  { label: 'Bhutan (+975)', value: '+975' },
  { label: 'Bolivia (+591)', value: '+591' },
  { label: 'Bosnia and Herzegovina (+387)', value: '+387' },
  { label: 'Botswana (+267)', value: '+267' },
  { label: 'Brazil (+55)', value: '+55' },
  { label: 'British Virgin Islands (+1)', value: '+1' },
  { label: 'Brunei (+673)', value: '+673' },
  { label: 'Bulgaria (+359)', value: '+359' },
  { label: 'Burkina Faso (+226)', value: '+226' },
  { label: 'Burundi (+257)', value: '+257' },
  { label: 'Cambodia (+855)', value: '+855' },
  { label: 'Cameroon (+237)', value: '+237' },
  { label: 'Canada (+1)', value: '+1' },
  { label: 'Cape Verde (+238)', value: '+238' },
  { label: 'Cayman Islands (+1)', value: '+1' },
  { label: 'Central African Republic (+236)', value: '+236' },
  { label: 'Chad (+235)', value: '+235' },
  { label: 'Chile (+56)', value: '+56' },
  { label: 'China (+86)', value: '+86' },
  { label: 'Colombia (+57)', value: '+57' },
  { label: 'Comoros (+269)', value: '+269' },
  { label: 'Cook Islands (+682)', value: '+682' },
  { label: 'Costa Rica (+506)', value: '+506' },
  { label: "Côte d'Ivoire (+225)", value: '+225' },
  { label: 'Croatia (+385)', value: '+385' },
  { label: 'Cuba (+53)', value: '+53' },
  { label: 'Curaçao (+599)', value: '+599' },
  { label: 'Cyprus (+357)', value: '+357' },
  { label: 'Czechia (+420)', value: '+420' },
  { label: 'Denmark (+45)', value: '+45' },
  { label: 'Djibouti (+253)', value: '+253' },
  { label: 'Dominica (+1)', value: '+1' },
  { label: 'Dominican Republic (+1)', value: '+1' },
  { label: 'Ecuador (+593)', value: '+593' },
  { label: 'Egypt (+20)', value: '+20' },
  { label: 'El Salvador (+503)', value: '+503' },
  { label: 'Equatorial Guinea (+240)', value: '+240' },
  { label: 'Eritrea (+291)', value: '+291' },
  { label: 'Estonia (+372)', value: '+372' },
  { label: 'Eswatini (+268)', value: '+268' },
  { label: 'Ethiopia (+251)', value: '+251' },
  { label: 'Falkland Islands (+500)', value: '+500' },
  { label: 'Faroe Islands (+298)', value: '+298' },
  { label: 'Fiji (+679)', value: '+679' },
  { label: 'Finland (+358)', value: '+358' },
  { label: 'France (+33)', value: '+33' },
  { label: 'French Guiana (+594)', value: '+594' },
  { label: 'French Polynesia (+689)', value: '+689' },
  { label: 'Gabon (+241)', value: '+241' },
  { label: 'Gambia (+220)', value: '+220' },
  { label: 'Georgia (+995)', value: '+995' },
  { label: 'Germany (+49)', value: '+49' },
  { label: 'Ghana (+233)', value: '+233' },
  { label: 'Gibraltar (+350)', value: '+350' },
  { label: 'Greece (+30)', value: '+30' },
  { label: 'Greenland (+299)', value: '+299' },
  { label: 'Grenada (+1)', value: '+1' },
  { label: 'Guadeloupe (+590)', value: '+590' },
  { label: 'Guam (+1)', value: '+1' },
  { label: 'Guatemala (+502)', value: '+502' },
  { label: 'Guernsey (+44)', value: '+44' },
  { label: 'Guinea (+224)', value: '+224' },
  { label: 'Guinea-Bissau (+245)', value: '+245' },
  { label: 'Guyana (+592)', value: '+592' },
  { label: 'Haiti (+509)', value: '+509' },
  { label: 'Honduras (+504)', value: '+504' },
  { label: 'Hong Kong (+852)', value: '+852' },
  { label: 'Hungary (+36)', value: '+36' },
  { label: 'Iceland (+354)', value: '+354' },
  { label: 'India (+91)', value: '+91' },
  { label: 'Indonesia (+62)', value: '+62' },
  { label: 'Iran (+98)', value: '+98' },
  { label: 'Iraq (+964)', value: '+964' },
  { label: 'Ireland (+353)', value: '+353' },
  { label: 'Isle of Man (+44)', value: '+44' },
  { label: 'Israel (+972)', value: '+972' },
  { label: 'Italy (+39)', value: '+39' },
  { label: 'Jamaica (+1)', value: '+1' },
  { label: 'Japan (+81)', value: '+81' },
  { label: 'Jersey (+44)', value: '+44' },
  { label: 'Jordan (+962)', value: '+962' },
  { label: 'Kazakhstan (+7)', value: '+7' },
  { label: 'Kenya (+254)', value: '+254' },
  { label: 'Kiribati (+686)', value: '+686' },
  { label: 'Kosovo (+383)', value: '+383' },
  { label: 'Kuwait (+965)', value: '+965' },
  { label: 'Kyrgyzstan (+996)', value: '+996' },
  { label: 'Laos (+856)', value: '+856' },
  { label: 'Latvia (+371)', value: '+371' },
  { label: 'Lebanon (+961)', value: '+961' },
  { label: 'Lesotho (+266)', value: '+266' },
  { label: 'Liberia (+231)', value: '+231' },
  { label: 'Libya (+218)', value: '+218' },
  { label: 'Liechtenstein (+423)', value: '+423' },
  { label: 'Lithuania (+370)', value: '+370' },
  { label: 'Luxembourg (+352)', value: '+352' },
  { label: 'Macau (+853)', value: '+853' },
  { label: 'Madagascar (+261)', value: '+261' },
  { label: 'Malawi (+265)', value: '+265' },
  { label: 'Malaysia (+60)', value: '+60' },
  { label: 'Maldives (+960)', value: '+960' },
  { label: 'Mali (+223)', value: '+223' },
  { label: 'Malta (+356)', value: '+356' },
  { label: 'Marshall Islands (+692)', value: '+692' },
  { label: 'Martinique (+596)', value: '+596' },
  { label: 'Mauritania (+222)', value: '+222' },
  { label: 'Mauritius (+230)', value: '+230' },
  { label: 'Mayotte (+262)', value: '+262' },
  { label: 'Mexico (+52)', value: '+52' },
  { label: 'Micronesia (+691)', value: '+691' },
  { label: 'Moldova (+373)', value: '+373' },
  { label: 'Monaco (+377)', value: '+377' },
  { label: 'Mongolia (+976)', value: '+976' },
  { label: 'Montenegro (+382)', value: '+382' },
  { label: 'Montserrat (+1)', value: '+1' },
  { label: 'Morocco (+212)', value: '+212' },
  { label: 'Mozambique (+258)', value: '+258' },
  { label: 'Myanmar (+95)', value: '+95' },
  { label: 'Namibia (+264)', value: '+264' },
  { label: 'Nauru (+674)', value: '+674' },
  { label: 'Nepal (+977)', value: '+977' },
  { label: 'Netherlands (+31)', value: '+31' },
  { label: 'New Caledonia (+687)', value: '+687' },
  { label: 'New Zealand (+64)', value: '+64' },
  { label: 'Nicaragua (+505)', value: '+505' },
  { label: 'Niger (+227)', value: '+227' },
  { label: 'Nigeria (+234)', value: '+234' },
  { label: 'Niue (+683)', value: '+683' },
  { label: 'North Korea (+850)', value: '+850' },
  { label: 'North Macedonia (+389)', value: '+389' },
  { label: 'Northern Mariana Islands (+1)', value: '+1' },
  { label: 'Norway (+47)', value: '+47' },
  { label: 'Oman (+968)', value: '+968' },
  { label: 'Pakistan (+92)', value: '+92' },
  { label: 'Palau (+680)', value: '+680' },
  { label: 'Palestine (+970)', value: '+970' },
  { label: 'Panama (+507)', value: '+507' },
  { label: 'Papua New Guinea (+675)', value: '+675' },
  { label: 'Paraguay (+595)', value: '+595' },
  { label: 'Peru (+51)', value: '+51' },
  { label: 'Philippines (+63)', value: '+63' },
  { label: 'Poland (+48)', value: '+48' },
  { label: 'Portugal (+351)', value: '+351' },
  { label: 'Puerto Rico (+1)', value: '+1' },
  { label: 'Qatar (+974)', value: '+974' },
  { label: 'Réunion (+262)', value: '+262' },
  { label: 'Romania (+40)', value: '+40' },
  { label: 'Russia (+7)', value: '+7' },
  { label: 'Rwanda (+250)', value: '+250' },
  { label: 'Saint Kitts and Nevis (+1)', value: '+1' },
  { label: 'Saint Lucia (+1)', value: '+1' },
  { label: 'Saint Vincent and the Grenadines (+1)', value: '+1' },
  { label: 'Samoa (+685)', value: '+685' },
  { label: 'San Marino (+378)', value: '+378' },
  { label: 'São Tomé and Príncipe (+239)', value: '+239' },
  { label: 'Saudi Arabia (+966)', value: '+966' },
  { label: 'Senegal (+221)', value: '+221' },
  { label: 'Serbia (+381)', value: '+381' },
  { label: 'Seychelles (+248)', value: '+248' },
  { label: 'Sierra Leone (+232)', value: '+232' },
  { label: 'Singapore (+65)', value: '+65' },
  { label: 'Sint Maarten (+1)', value: '+1' },
  { label: 'Slovakia (+421)', value: '+421' },
  { label: 'Slovenia (+386)', value: '+386' },
  { label: 'Solomon Islands (+677)', value: '+677' },
  { label: 'Somalia (+252)', value: '+252' },
  { label: 'South Africa (+27)', value: '+27' },
  { label: 'South Korea (+82)', value: '+82' },
  { label: 'Spain (+34)', value: '+34' },
  { label: 'Sri Lanka (+94)', value: '+94' },
  { label: 'Sudan (+249)', value: '+249' },
  { label: 'Suriname (+597)', value: '+597' },
  { label: 'Sweden (+46)', value: '+46' },
  { label: 'Switzerland (+41)', value: '+41' },
  { label: 'Syria (+963)', value: '+963' },
  { label: 'Taiwan (+886)', value: '+886' },
  { label: 'Tajikistan (+992)', value: '+992' },
  { label: 'Thailand (+66)', value: '+66' },
  { label: 'Timor-Leste (+670)', value: '+670' },
  { label: 'Togo (+228)', value: '+228' },
  { label: 'Tonga (+676)', value: '+676' },
  { label: 'Trinidad and Tobago (+1)', value: '+1' },
  { label: 'Tunisia (+216)', value: '+216' },
  { label: 'Turkey (+90)', value: '+90' },
  { label: 'Turkmenistan (+993)', value: '+993' },
  { label: 'Turks and Caicos Islands (+1)', value: '+1' },
  { label: 'Tuvalu (+688)', value: '+688' },
  { label: 'Uganda (+256)', value: '+256' },
  { label: 'Ukraine (+380)', value: '+380' },
  { label: 'United Arab Emirates (+971)', value: '+971' },
  { label: 'United Kingdom (+44)', value: '+44' },
  { label: 'United States (+1)', value: '+1' },
  { label: 'Uruguay (+598)', value: '+598' },
  { label: 'Uzbekistan (+998)', value: '+998' },
  { label: 'Vanuatu (+678)', value: '+678' },
  { label: 'Venezuela (+58)', value: '+58' },
  { label: 'Vietnam (+84)', value: '+84' },
  { label: 'Yemen (+967)', value: '+967' },
  { label: 'Zambia (+260)', value: '+260' },
  { label: 'Zimbabwe (+263)', value: '+263' },
  { label: 'Other (+)', value: '+' },
];

export default function CreateLoan() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Company settings from Firestore
  const [settings, setSettings] = useState<any>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);

  // Form fields
  const [principalStr, setPrincipalStr] = useState('');
  const [durationMonths, setDurationMonths] = useState('');

  // Customer
  const [customerName, setCustomerName] = useState('');
  const [customerPhonePrefix, setCustomerPhonePrefix] = useState('+255');
  const [customerPhoneNumber, setCustomerPhoneNumber] = useState('');
  const customerFullPhone = `${customerPhonePrefix}${customerPhoneNumber}`;

  const [customerIdNumber, setCustomerIdNumber] = useState('');
  const [customerDocument, setCustomerDocument] = useState<File | null>(null);

  // Guarantor
  const [guarantorName, setGuarantorName] = useState('');
  const [guarantorPhonePrefix, setGuarantorPhonePrefix] = useState('+255');
  const [guarantorPhoneNumber, setGuarantorPhoneNumber] = useState('');
  const guarantorFullPhone = `${guarantorPhonePrefix}${guarantorPhoneNumber}`;

  const [guarantorRelation, setGuarantorRelation] = useState('');
  const [guarantorIdNumber, setGuarantorIdNumber] = useState('');
  const [guarantorDocument, setGuarantorDocument] = useState<File | null>(null);

  // Load settings in real-time
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'company_settings'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings(data);
        // Set default duration if available and none selected
        if (data.durationOptions?.length > 0 && !durationMonths) {
          setDurationMonths(data.durationOptions[0].toString());
        }
      }
      setSettingsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Calculations using real settings
  const principal = Number(principalStr.replace(/\D/g, '')) || 0;
  const months = Number(durationMonths) || 0;

  const interestRatePercent = settings?.interestRate || 0;
  const interestAmount = principal * (interestRatePercent / 100);
  const totalPayment = principal + interestAmount;
  const monthlyPayment = months > 0 ? Math.round(totalPayment / months) : 0;

  const amountError = () => {
    if (!settings) return 'Settings zinaendelea kupakiwa...';
    if (principal > 0 && principal < settings.minAmount) {
      return `Kiasi cha chini ni TZS ${settings.minAmount.toLocaleString()}`;
    }
    if (principal > 0 && principal > settings.maxAmount) {
      return `Kiasi cha juu ni TZS ${settings.maxAmount.toLocaleString()}`;
    }
    return '';
  };

  const isPhoneValid = (phone: string) => phone.length >= 9 && /^\d+$/.test(phone);

  const handleSubmit = async () => {
    if (!auth.currentUser) return alert('Login first');
    if (!settings) return alert('Settings zinaendelea kupakiwa...');

    if (!isPhoneValid(customerPhoneNumber)) return alert('Namba ya simu ya mteja lazima iwe na tarakimu 9 au zaidi');
    if (!isPhoneValid(guarantorPhoneNumber)) return alert('Namba ya simu ya mdhamini lazima iwe na tarakimu 9 au zaidi');

    const amountErr = amountError();
    if (amountErr) return alert(amountErr);

    if (!durationMonths) return alert('Chagua muda wa mkopo');

    if (!customerDocument) return alert('Pakia kitambulisho cha mteja');
    if (!guarantorDocument) return alert('Pakia kitambulisho cha mdhamini');

    setLoading(true);
    try {
      await addDoc(collection(db, 'loans'), {
        principal,
        loanDuration: months,
        interestRate: interestRatePercent,
        totalAmount: totalPayment,
        monthlyPayment,
        balanceDue: totalPayment,
        customerName,
        customerPhone: customerFullPhone,
        customerIdNumber,
        customerDocumentUrl: 'uploading...',
        guarantorName,
        guarantorPhone: guarantorFullPhone,
        guarantorRelation,
        guarantorIdNumber,
        guarantorDocumentUrl: 'uploading...',
        status: 'pending',
        createdBy: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        payments: [],
        lateFeeRate: settings.lateFeeRate || 0,
      });

      alert('Mkopo umesajiliwa kikamilifu!');
      router.push('/loans');
    } catch (err: any) {
      alert('Hitilafu: ' + err.message);
    }
    setLoading(false);
  };

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Back to Dashboard Button */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-lg"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </Link>
      </div>

      <h1 className="text-4xl font-bold text-center mb-8">Sajili Mkopo Mpya</h1>

      <div className="mb-10">
        <div className="flex justify-between text-sm font-medium text-gray-600 mb-2">
          <span>1. Kiasi & Muda</span>
          <span>2. Mteja</span>
          <span>3. Mdhamini</span>
          <span>4. Thibitisha</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-green-600 transition-all duration-500" style={{ width: `${(step / 4) * 100}%` }} />
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); step === 4 ? handleSubmit() : setStep(step + 1); }}>
        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-6 bg-white p-8 rounded-2xl shadow">
            <h2 className="text-2xl font-bold">1. Chagua Kiasi & Muda wa Mkopo</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-lg font-medium mb-2">Kiasi cha Mkopo (TZS)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                  value={principalStr}
                  onChange={(e) => setPrincipalStr(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-5 py-4 border-2 rounded-xl text-xl"
                  placeholder="500000"
                />
                {amountError() && (
                  <p className="text-red-600 text-sm mt-2">{amountError()}</p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  Min: TZS {settings?.minAmount?.toLocaleString() || 'loading...'}  
                  Max: TZS {settings?.maxAmount?.toLocaleString() || 'loading...'}
                </p>
              </div>

              <div>
                <label className="block text-lg font-medium mb-2">Muda (Miezi)</label>
                <select
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(e.target.value)}
                  className="w-full px-5 py-4 border-2 rounded-xl text-xl"
                  required
                >
                  <option value="">Chagua muda</option>
                  {settings?.durationOptions?.map((dur: number) => (
                    <option key={dur} value={dur}>
                      {dur} Miezi
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {principal > 0 && months > 0 && (
              <div className="mt-8 p-6 bg-green-50 rounded-xl border border-green-200">
                <h3 className="text-xl font-semibold text-green-800 mb-4">Makadirio ya Malipo</h3>
                <div className="grid md:grid-cols-2 gap-8 text-lg">
                  <div>
                    <p className="text-gray-700 font-medium">Riba ({settings?.interestRate || 0}%):</p>
                    <p className="text-3xl font-bold text-green-700">
                      TZS {interestAmount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-700 font-medium">Jumla ya Kulipa:</p>
                    <p className="text-3xl font-bold text-green-700">
                      TZS {totalPayment.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-700 font-medium">Malipo ya Mwezi:</p>
                    <p className="text-3xl font-bold text-green-700">
                      TZS {monthlyPayment.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2 - Customer (full country codes kept) */}
        {step === 2 && (
          <div className="space-y-8 bg-white p-8 rounded-2xl shadow">
            <h2 className="text-2xl font-bold">2. Taarifa za Mteja</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-lg font-medium mb-2">Jina Kamili la Mteja</label>
                <input
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-5 py-4 border-2 rounded-xl text-lg"
                  placeholder="Jina Kamili"
                />
              </div>
              <div>
                <label className="block text-lg font-medium mb-2">Namba ya Simu ya Mteja</label>
                <div className="flex gap-2">
                  <select
                    value={customerPhonePrefix}
                    onChange={(e) => setCustomerPhonePrefix(e.target.value)}
                    className="px-4 py-4 border-2 rounded-xl text-lg bg-gray-50 w-56"
                  >
                    {countryCodes.map(p => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                  <input
                    placeholder="768000111"
                    required
                    value={customerPhoneNumber}
                    onChange={(e) => setCustomerPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    maxLength={15}
                    className="flex-1 px-5 py-4 border-2 rounded-xl text-lg"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">Simu kamili: {customerFullPhone}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Kitambulisho cha Mteja</h3>
              <div>
                <label className="block text-lg font-medium mb-2">Namba ya Kitambulisho</label>
                <input
                  required
                  value={customerIdNumber}
                  onChange={(e) => setCustomerIdNumber(e.target.value)}
                  className="w-full px-5 py-4 border-2 rounded-xl text-lg"
                  placeholder="Namba ya Kitambulisho"
                />
              </div>
              <div>
                <label className="block text-lg font-medium mb-2">Pakia Kitambulisho cha Mteja (PDF au Picha)</label>
                <div className="flex items-center gap-4 p-4 border-2 border-dashed border-gray-300 rounded-xl hover:bg-gray-50 transition">
                  <Upload size={24} className="text-gray-500" />
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setCustomerDocument(e.target.files?.[0] || null)}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                {customerDocument && <p className="text-sm text-green-600 mt-2">Imechaguliwa: {customerDocument.name}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Step 3 - Guarantor (full country codes kept) */}
        {step === 3 && (
          <div className="space-y-8 bg-white p-8 rounded-2xl shadow">
            <h2 className="text-2xl font-bold">3. Taarifa za Mdhamini</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-lg font-medium mb-2">Jina Kamili la Mdhamini</label>
                <input
                  required
                  value={guarantorName}
                  onChange={(e) => setGuarantorName(e.target.value)}
                  className="w-full px-5 py-4 border-2 rounded-xl text-lg"
                  placeholder="Jina la Mdhamini"
                />
              </div>
              <div>
                <label className="block text-lg font-medium mb-2">Namba ya Simu ya Mdhamini</label>
                <div className="flex gap-2">
                  <select
                    value={guarantorPhonePrefix}
                    onChange={(e) => setGuarantorPhonePrefix(e.target.value)}
                    className="px-4 py-4 border-2 rounded-xl text-lg bg-gray-50 w-56"
                  >
                    {countryCodes.map(p => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                  <input
                    placeholder="768000111"
                    required
                    value={guarantorPhoneNumber}
                    onChange={(e) => setGuarantorPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    maxLength={15}
                    className="flex-1 px-5 py-4 border-2 rounded-xl text-lg"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">Simu kamili: {guarantorFullPhone}</p>
              </div>
              <div>
                <label className="block text-lg font-medium mb-2">Uhusiano na Mteja</label>
                <input
                  required
                  value={guarantorRelation}
                  onChange={(e) => setGuarantorRelation(e.target.value)}
                  className="w-full px-5 py-4 border-2 rounded-xl text-lg"
                  placeholder="Dada, Kaka, Mzazi"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Kitambulisho cha Mdhamini</h3>
              <div>
                <label className="block text-lg font-medium mb-2">Namba ya Kitambulisho cha Mdhamini</label>
                <input
                  required
                  value={guarantorIdNumber}
                  onChange={(e) => setGuarantorIdNumber(e.target.value)}
                  className="w-full px-5 py-4 border-2 rounded-xl text-lg"
                  placeholder="Namba ya Kitambulisho"
                />
              </div>
              <div>
                <label className="block text-lg font-medium mb-2">Pakia Kitambulisho cha Mdhamini (PDF au Picha)</label>
                <div className="flex items-center gap-4 p-4 border-2 border-dashed border-gray-300 rounded-xl hover:bg-gray-50 transition">
                  <Upload size={24} className="text-gray-500" />
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setGuarantorDocument(e.target.files?.[0] || null)}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                {guarantorDocument && <p className="text-sm text-green-600 mt-2">Imechaguliwa: {guarantorDocument.name}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Step 4 - Confirm */}
        {step === 4 && (
          <div className="space-y-6 bg-white p-8 rounded-2xl shadow">
            <h2 className="text-2xl font-bold">4. Thibitisha & Tuma Mkopo</h2>
            <div className="p-6 bg-gray-50 rounded-xl space-y-4 text-lg">
              <p><strong>Mteja:</strong> {customerName} | Simu: {customerFullPhone}</p>
              <p><strong>Namba ya Kitambulisho:</strong> {customerIdNumber}</p>
              {customerDocument && <p><strong>Hati ya Mteja:</strong> {customerDocument.name}</p>}

              <p><strong>Mdhamini:</strong> {guarantorName} | Simu: {guarantorFullPhone}</p>
              <p><strong>Uhusiano:</strong> {guarantorRelation}</p>
              <p><strong>Namba ya Kitambulisho ya Mdhamini:</strong> {guarantorIdNumber}</p>
              {guarantorDocument && <p><strong>Hati ya Mdhamini:</strong> {guarantorDocument.name}</p>}

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xl font-bold text-green-700">
                  Jumla ya Kulipa: TZS {totalPayment.toLocaleString()}
                </p>
                <p className="text-lg text-gray-700 mt-2">
                  Malipo ya mwezi: TZS {monthlyPayment.toLocaleString()}
                </p>
              </div>

              <p className="text-green-600 font-semibold mt-6">
                Thibitisha kuwa taarifa zote na hati zilizopakiwa ni sahihi
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !!amountError()}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-2xl py-6 rounded-2xl shadow-2xl flex items-center justify-center gap-4 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" /> Inasajili...
                </>
              ) : (
                'Tuma Mkopo Sasa'
              )}
            </button>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-8">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-10 py-5 bg-gray-300 hover:bg-gray-400 rounded-xl text-xl font-bold flex items-center gap-3"
            >
              <ArrowLeft size={24} /> Nyuma
            </button>
          )}
          <button
            type="submit"
            disabled={loading || !!amountError()}
            className="ml-auto px-10 py-5 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white rounded-xl text-xl font-bold flex items-center gap-3 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : step === 4 ? 'Tuma Mkopo' : 'Endelea'}
            {step < 4 && <ArrowRight size={24} />}
          </button>
        </div>
      </form>
    </div>
  );
}