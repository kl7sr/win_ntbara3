export type Language = 'ar' | 'fr' | 'en';

export interface Translations {
  appName: string;
  appSubtitle: string;
  allWilayas: string;
  pointsCount: string;
  addPoint: string;
  nearestToMe: string;
  exploreMap: string;
  adminPanel: string;
  adminTitle: string;
  adminSubtitle: string;
  emergencyTitle: string;
  emergencySubtitle: string;
  callNumber: string;
  whatsappShare: string;
  copyLink: string;
  copied: string;
  openGoogleMaps: string;
  categories: {
    all: string;
    food_water: string;
    clothes: string;
    medical: string;
    shelter: string;
    baby_supplies: string;
    burnt_zone: string;
    extinguished: string;
  };
  details: {
    organizer: string;
    phone: string;
    address: string;
    commune: string;
    wilaya: string;
    verified: string;
    unverified: string;
    extinguishedFire: string;
    activeFire: string;
    distanceAway: string;
    photosAttached: string;
    adminEdit: string;
    save: string;
    cancel: string;
  };
  addModal: {
    title: string;
    subtitle: string;
    pointName: string;
    organizerName: string;
    primaryPhone: string;
    wilayaSelect: string;
    communeInput: string;
    addressDetail: string;
    notes: string;
    selectCategories: string;
    submit: string;
    success: string;
  };
  pwa: {
    installTitle: string;
    installDesc: string;
    installBtn: string;
    free: string;
  };
}

export const TRANSLATIONS: Record<Language, Translations> = {
  ar: {
    appName: 'وين نتبرع',
    appSubtitle: 'المنصة الوطنية للتبرعات والإغاثة',
    allWilayas: 'كل الولايات',
    pointsCount: 'نقطة',
    addPoint: 'أضف نقطة',
    nearestToMe: 'الأقرب لي',
    exploreMap: 'الخريطة',
    adminPanel: 'الإدارة',
    adminTitle: 'لوحة تحكم المشرفين',
    adminSubtitle: 'إدارة وتعديل مراكز التبرع ومناطق الحرائق',
    emergencyTitle: 'خلية متابعة حرائق الغابات والإغاثة الوطنية',
    emergencySubtitle: 'أرقام الطوارئ: الحماية المدنية (14) | الدرك الوطني (1055) | الإسعاف (1021)',
    callNumber: 'اتصال مباشر',
    whatsappShare: 'مشاركة بالواتساب',
    copyLink: 'نسخ الرابط',
    copied: 'تم النسخ ✓',
    openGoogleMaps: 'التوجه عبر Google Maps',
    categories: {
      all: 'الكل',
      food_water: 'غذاء ومياه',
      clothes: 'ملابس وأفرشة',
      medical: 'مستلزمات طبية',
      shelter: 'إيواء ومفروشات',
      baby_supplies: 'مستلزمات رضع',
      burnt_zone: '🔥 مناطق الحرائق',
      extinguished: '💨 تم الإخماد',
    },
    details: {
      organizer: 'المشرف / الجمعية',
      phone: 'الهاتف',
      address: 'العنوان',
      commune: 'البلدية',
      wilaya: 'الولاية',
      verified: 'موقع مؤكد وموثق ✓',
      unverified: 'موقع غير مؤكد رسمياً',
      extinguishedFire: '💨 تم إخماد الحريق والسيطرة عليه',
      activeFire: '🔥 حريق نشط / بحاجة لإغاثة عاجلة',
      distanceAway: 'يبعد عنك',
      photosAttached: 'صور المركز المرفقة',
      adminEdit: 'تعديل بيانات هذه النقطة (Admin Edit)',
      save: 'حفظ التعديلات',
      cancel: 'إلغاء',
    },
    addModal: {
      title: 'إضافة مركز تبرع أو نقطة إغاثة',
      subtitle: 'ساهم في إرشاد المواطنين والمتطوعين لأماكن جمع المساعدات',
      pointName: 'اسم المركز / النقطة *',
      organizerName: 'اسم الجمعية / المشرف (اختياري)',
      primaryPhone: 'رقم الهاتف للتواصل *',
      wilayaSelect: 'الولاية *',
      communeInput: 'البلدية *',
      addressDetail: 'العنوان التفصيلي',
      notes: 'ملاحظات أو توجيهات خاصة بالتبرع',
      selectCategories: 'أنواع المساعدات المقبولة:',
      submit: 'إرسال ونشر النقطة على الخريطة',
      success: 'تمت إضافة النقطة بنجاح، شكراً لمساهمتك!',
    },
    pwa: {
      installTitle: 'تثبيت تطبيق «وين نتبرع»',
      installDesc: 'أضف التطبيق لشاشتك للوصول الفوري والعمل بدون إنترنت',
      installBtn: 'تثبيت',
      free: 'مجاني',
    },
  },
  fr: {
    appName: 'Win Ntbara3',
    appSubtitle: 'Plateforme Nationale de Dons & de Secours',
    allWilayas: 'Toutes les wilayas',
    pointsCount: 'points',
    addPoint: 'Ajouter un point',
    nearestToMe: 'Plus proches',
    exploreMap: 'Carte',
    adminPanel: 'Administration',
    adminTitle: 'Panneau d\'Administration',
    adminSubtitle: 'Gestion des centres de dons et zones de crise',
    emergencyTitle: 'Cellule de suivi des feux de forêts et secours',
    emergencySubtitle: 'Urgences : Protection Civile (14) | Gendarmerie (1055) | SAMU (1021)',
    callNumber: 'Appeler',
    whatsappShare: 'Partager WhatsApp',
    copyLink: 'Copier le lien',
    copied: 'Copié ✓',
    openGoogleMaps: 'Itinéraire Google Maps',
    categories: {
      all: 'Tous',
      food_water: 'Nourriture & Eau',
      clothes: 'Vêtements & Draps',
      medical: 'Médical & Soins',
      shelter: 'Hébergement',
      baby_supplies: 'Bébés & Enfants',
      burnt_zone: '🔥 Zones Incendies',
      extinguished: '💨 Feux éteints',
    },
    details: {
      organizer: 'Organisateur / Association',
      phone: 'Téléphone',
      address: 'Adresse',
      commune: 'Commune',
      wilaya: 'Wilaya',
      verified: 'Lieu vérifié et confirmé ✓',
      unverified: 'Lieu non confirmé officiellement',
      extinguishedFire: '💨 Incendie maîtrisé et éteint',
      activeFire: '🔥 Incendie actif / Secours urgent',
      distanceAway: 'À une distance de',
      photosAttached: 'Photos du centre',
      adminEdit: 'Modifier ce point (Admin Edit)',
      save: 'Enregistrer',
      cancel: 'Annuler',
    },
    addModal: {
      title: 'Ajouter un centre de dons ou secours',
      subtitle: 'Aidez les citoyens et volontaires à localiser les points de collecte',
      pointName: 'Nom du centre / lieu *',
      organizerName: 'Association / Organisateur (optionnel)',
      primaryPhone: 'Numéro de contact *',
      wilayaSelect: 'Wilaya *',
      communeInput: 'Commune *',
      addressDetail: 'Adresse détaillée',
      notes: 'Instructions ou horaires',
      selectCategories: 'Types de dons acceptés :',
      submit: 'Publier le point sur la carte',
      success: 'Point ajouté avec succès, merci pour votre aide !',
    },
    pwa: {
      installTitle: 'Installer l\'application Win Ntbara3',
      installDesc: 'Accès rapide hors-ligne et repérage des centres proches',
      installBtn: 'Installer',
      free: 'Gratuit',
    },
  },
  en: {
    appName: 'Win Ntbara3',
    appSubtitle: 'National Relief & Donation Map for Algeria',
    allWilayas: 'All Wilayas',
    pointsCount: 'points',
    addPoint: 'Add Point',
    nearestToMe: 'Nearest',
    exploreMap: 'Map',
    adminPanel: 'Admin',
    adminTitle: 'Admin Dashboard',
    adminSubtitle: 'Manage relief centers and emergency crisis zones',
    emergencyTitle: 'Forest Fire Monitoring & Relief Crisis Cell',
    emergencySubtitle: 'Emergency: Civil Protection (14) | Gendarmerie (1055) | Ambulance (1021)',
    callNumber: 'Call Now',
    whatsappShare: 'Share WhatsApp',
    copyLink: 'Copy Link',
    copied: 'Copied ✓',
    openGoogleMaps: 'Google Maps Directions',
    categories: {
      all: 'All',
      food_water: 'Food & Water',
      clothes: 'Clothes & Blankets',
      medical: 'Medical Supplies',
      shelter: 'Shelter & Mats',
      baby_supplies: 'Baby Supplies',
      burnt_zone: '🔥 Fire Zones',
      extinguished: '💨 Extinguished',
    },
    details: {
      organizer: 'Organizer / Charity',
      phone: 'Phone',
      address: 'Address',
      commune: 'Municipality',
      wilaya: 'Wilaya',
      verified: 'Verified & Confirmed ✓',
      unverified: 'Unconfirmed Location',
      extinguishedFire: '💨 Fire Extinguished & Contained',
      activeFire: '🔥 Active Fire / Urgent Relief Needed',
      distanceAway: 'Distance away',
      photosAttached: 'Attached Photos',
      adminEdit: 'Edit Point (Admin Edit)',
      save: 'Save Changes',
      cancel: 'Cancel',
    },
    addModal: {
      title: 'Add Donation or Relief Center',
      subtitle: 'Guide citizens and volunteers to aid collection hubs across Algeria',
      pointName: 'Center / Hub Name *',
      organizerName: 'Organizer / Charity (Optional)',
      primaryPhone: 'Contact Phone Number *',
      wilayaSelect: 'Wilaya *',
      communeInput: 'Municipality *',
      addressDetail: 'Detailed Address',
      notes: 'Instructions or operating hours',
      selectCategories: 'Accepted Aid Categories:',
      submit: 'Publish Point to Live Map',
      success: 'Point added successfully, thank you for your contribution!',
    },
    pwa: {
      installTitle: 'Install Win Ntbara3 App',
      installDesc: 'Instant offline access to all donation points across Algeria',
      installBtn: 'Install',
      free: 'Free',
    },
  },
};
