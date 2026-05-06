import * as SecureStore from 'expo-secure-store';
import { setItemAsync } from './customSecureStore';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

// ── 3 Pre-seeded Supplier Companies ──────────────────────────────────────────
// Fields cover BOTH screens:
//   • AddSupplier.jsx  → street, corporateAddress, showCorporateAddress, accountNumber, upiId
//   • CompanyDetails.jsx → address, corpAddress, corpCity, corpState, corpPincode,
//                          showCorpAddress, accNo, upi, showPayment, showTerms, qrUrl
const SEED_SUPPLIERS = [
  {
    // ── Company 1: ProGarden India ──────────────────────────────────────────
    firmName:         'ProGarden India',
    ownerName:        '',
    email:            'progarden.india@gmail.com',
    mobile:           '9873892971',
    gstin:            '',
    pan:              'ABIFP3808N',
    udyam:            'UDYAM-DL-10-0101527',

    // Registered Address (AddSupplier: street | CompanyDetails: address)
    street:           'RZ 21/274, KH NO 274, Geetanjali Park, West Sagarpur',
    address:          'RZ 21/274, KH NO 274, Geetanjali Park, West Sagarpur',
    city:             'New Delhi',
    state:            'Delhi',
    pincode:          '110046',
    country:          'India',

    // Corporate Address (AddSupplier: corporateAddress | CompanyDetails: corpAddress)
    corporateAddress: 'ANDC Instart Foundation, Govindpuri, Giri Nagar, Kalkaji, New Delhi - 110019',
    corpAddress:      'ANDC Instart Foundation, Govindpuri, Giri Nagar, Kalkaji',
    corpCity:         'New Delhi',
    corpState:        'Delhi',
    corpPincode:      '110019',

    // Corporate toggle (AddSupplier: showCorporateAddress | CompanyDetails: showCorpAddress)
    showCorporateAddress: true,
    showCorpAddress:      true,

    // Logo
    logoKey:  'progardenlogo',   // bundled asset key → both PDF generators + CompanyDetails
    logoUrl:  '',                // user-picked URI (empty for seeded companies)
    qrUrl:    '',

    // Bank (AddSupplier: accountNumber, upiId | CompanyDetails: accNo, upi)
    bankName:      '',
    accountNumber: '',
    accNo:         '',
    ifsc:          '',
    upiId:         '',
    upi:           '',
    website:       '',

    // PDF Visibility Toggles
    showRegisteredAddress: true,
    showGstin:             false,
    showPan:               true,
    showUdyam:             true,
    showEmail:             true,
    showMobile:            true,
    showPayment:           false,
    showTerms:             false,
    isDefault:             true,
    terms:                 '',
  },
  {
    // ── Company 2: Harendrama Constructions ─────────────────────────────────
    firmName:         'Harendrama Constructions Private Limited',
    ownerName:        '',
    email:            'info@harendramaconstructions.com',
    mobile:           '9873892971',
    gstin:            '07AAFCH4804B1Z2',
    pan:              '',
    udyam:            '',

    street:           'IST Floor, I-304, Karampura, Karampura West',
    address:          'IST Floor, I-304, Karampura, Karampura West',
    city:             'West Delhi',
    state:            'Delhi',
    pincode:          '110015',
    country:          'India',

    corporateAddress: '',
    corpAddress:      '',
    corpCity:         '',
    corpState:        '',
    corpPincode:      '',

    showCorporateAddress: false,
    showCorpAddress:      false,

    logoKey:  'hardendramalogo',
    logoUrl:  '',
    qrUrl:    '',

    bankName:      '',
    accountNumber: '',
    accNo:         '',
    ifsc:          '',
    upiId:         '',
    upi:           '',
    website:       '',

    showRegisteredAddress: true,
    showGstin:             true,
    showPan:               false,
    showUdyam:             false,
    showEmail:             true,
    showMobile:            true,
    showPayment:           false,
    showTerms:             false,
    isDefault:             false,
    terms:                 '',
  },
  {
    // ── Company 3: Vertical Garden India ────────────────────────────────────
    firmName:         'Vertical Garden India',
    ownerName:        '',
    email:            'india.verticalgarden@gmail.com',
    mobile:           '9873892971',
    gstin:            '',
    pan:              '',
    udyam:            '',

    street:           'ANDC Instart Foundation, Govindpuri, Kalkaji',
    address:          'ANDC Instart Foundation, Govindpuri, Kalkaji',
    city:             'New Delhi',
    state:            'Delhi',
    pincode:          '110019',
    country:          'India',

    corporateAddress: '',
    corpAddress:      '',
    corpCity:         '',
    corpState:        '',
    corpPincode:      '',

    showCorporateAddress: false,
    showCorpAddress:      false,

    logoKey:  'Vgilogo',
    logoUrl:  '',
    qrUrl:    '',

    bankName:      '',
    accountNumber: '',
    accNo:         '',
    ifsc:          '',
    upiId:         '',
    upi:           '',
    website:       '',

    showRegisteredAddress: true,
    showGstin:             false,
    showPan:               false,
    showUdyam:             false,
    showEmail:             true,
    showMobile:            true,
    showPayment:           false,
    showTerms:             false,
    isDefault:             false,
    terms:                 '',
  },
];

// ── App Initializer ───────────────────────────────────────────────────────────
export async function clearDemoDataOnce() {
  try {
    const initialized = await SecureStore.getItemAsync('appInitV1');
    if (initialized) return;

    const uid = await SecureStore.getItemAsync('app_user_id');
    if (!uid) return;

    // Direct check to Firestore to ensure we don't wipe existing cloud data
    try {
      const docRef = doc(db, 'users', uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data && (data.supplier || data.products || data.buyer)) {
          await SecureStore.setItemAsync('appInitV1', 'true');
          console.log('App initialized: User data already exists in cloud. Skipping seed.');
          return;
        }
      }
    } catch (e) {
      console.error('Could not verify cloud data for seeding. Aborting seed to prevent accidental wipe.', e);
      return; // Do NOT proceed to wipe if network fails!
    }

    const keysToWipe = [
      'products', 'product',
      'buyer',
      'bankdetails',
      'termsandconditions',
      'signature',
      'quotation', 'quotations',
      'invoice', 'invoices',
      'shipto',
    ];

    for (const key of keysToWipe) {
      try { await setItemAsync(key, JSON.stringify([])); } catch {}
    }

    await setItemAsync('supplier', JSON.stringify(SEED_SUPPLIERS));
    await SecureStore.setItemAsync('appInitV1', 'true');
    console.log('App initialized: 3 suppliers seeded');
  } catch {}
}
