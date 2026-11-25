export type TranslationKey =
  | 'appName'
  | 'pos'
  | 'orders'
  | 'products'
  | 'expenses'
  | 'khata'
  | 'reports'
  | 'settings'
  | 'onlineSynced'
  | 'offlineLocal'
  | 'pendingSync'
  | 'language'
  | 'english'
  | 'urdu'
  | 'cashierMode'
  | 'ownerMode'
  | 'lockOwner'
  | 'unlockOwner'
  | 'enterOwnerPin'
  | 'ownerPinHint'
  | 'pinIncorrect'
  | 'confirm'
  | 'cancel'
  | 'continue'
  | 'back'
  | 'finish'
  | 'skip'
  | 'loading'
  | 'comingSoon'
  | 'modulePlaceholder'
  | 'onboardingWelcome'
  | 'onboardingSubtitle'
  | 'chooseBusiness'
  | 'businessFood'
  | 'businessFoodDesc'
  | 'businessRetail'
  | 'businessRetailDesc'
  | 'businessBakery'
  | 'businessBakeryDesc'
  | 'shopDetails'
  | 'shopName'
  | 'shopAddress'
  | 'shopPhone'
  | 'ownerWhatsApp'
  | 'chooseLanguage'
  | 'loadDemoData'
  | 'loadDemoDataDesc'
  | 'yesLoadDemo'
  | 'startEmpty'
  | 'setupComplete'
  | 'setupCompleteDesc'
  | 'requiredField'
  | 'menu'
  | 'today'
  | 'logoutOwner'
  | 'searchProducts'
  | 'barcodeSku'
  | 'allCategories'
  | 'cart'
  | 'emptyCart'
  | 'subtotal'
  | 'discount'
  | 'total'
  | 'payPrint'
  | 'holdOrder'
  | 'heldOrders'
  | 'resume'
  | 'clearCart'
  | 'qty'
  | 'price'
  | 'stock'
  | 'lowStock'
  | 'cash'
  | 'onlinePay'
  | 'udhaar'
  | 'exact'
  | 'changeDue'
  | 'cashReceived'
  | 'dineIn'
  | 'takeaway'
  | 'delivery'
  | 'orderType'
  | 'selectVariant'
  | 'selectWeight'
  | 'addProduct'
  | 'editProduct'
  | 'deleteProduct'
  | 'addCategory'
  | 'editCategory'
  | 'categories'
  | 'productName'
  | 'category'
  | 'costPrice'
  | 'sku'
  | 'unit'
  | 'trackStock'
  | 'fractionalQty'
  | 'variants'
  | 'save'
  | 'delete'
  | 'noProducts'
  | 'noCategories'
  | 'color'
  | 'image'
  | 'uploadImage'
  | 'active'
  | 'inactive'
  | 'orderSaved'
  | 'orderHeld'
  | 'cartRestored'
  | 'ownerRequiredPrices'
  | 'items'
  | 'viewCart'
  | 'checkout'
  | 'weightPresets'
  | 'addVariant'
  | 'variantName'
  | 'searchOrScan'
  | 'parked'
  | 'deleteConfirm'
  | 'productSaved'
  | 'categorySaved'
  | 'deleted'
  | 'notFoundSku'
  | 'receiptSettings'
  | 'printerWidth'
  | 'receiptPreview'
  | 'showLogo'
  | 'showToken'
  | 'showOrderType'
  | 'showTax'
  | 'showSku'
  | 'showUdhaarBalance'
  | 'showItemDiscount'
  | 'autoPrintKot'
  | 'taxPercent'
  | 'footerMessage'
  | 'uploadLogo'
  | 'removeLogo'
  | 'ownerPin'
  | 'changePin'
  | 'newPin'
  | 'confirmPin'
  | 'pinUpdated'
  | 'settingsSaved'
  | 'businessType'
  | 'testPrint'
  | 'kotPreview'
  | 'shopProfile'
  | 'mm58'
  | 'mm80'
  | 'printing'
  | 'todayOrders'
  | 'allOrders'
  | 'reprint'
  | 'reprintKot'
  | 'voidBill'
  | 'voided'
  | 'voidSuccess'
  | 'addExpense'
  | 'expenseTitle'
  | 'expenseCategory'
  | 'amount'
  | 'note'
  | 'noOrders'
  | 'noExpenses'
  | 'customers'
  | 'addCustomer'
  | 'customerName'
  | 'balance'
  | 'wasooli'
  | 'recordPayment'
  | 'ledger'
  | 'noCustomers'
  | 'selectCustomer'
  | 'dayClosing'
  | 'openingCash'
  | 'cashSales'
  | 'onlineSales'
  | 'udhaarSales'
  | 'totalExpenses'
  | 'khataReceived'
  | 'expectedCash'
  | 'actualCash'
  | 'sendWhatsApp'
  | 'saveClosing'
  | 'closingSaved'
  | 'exportBackup'
  | 'restoreBackup'
  | 'backupExported'
  | 'backupRestored'
  | 'backupSection'
  | 'backupWarning'
  | 'filterDate'
  | 'completed'
  | 'debit'
  | 'credit'
  | 'viewHeld'
  | 'heldCount'
  | 'resumeOrder'
  | 'discardHeld'
  | 'cartHasItems'
  | 'replaceAndResume'
  | 'noHeldOrders'
  | 'backupReminder'
  | 'last7Days'
  | 'last30Days'
  | 'customRange'
  | 'loadMore'
  | 'shortcutGuide'
  | 'shortcutSearch'
  | 'shortcutOrderType'
  | 'shortcutCheckout'
  | 'shortcutHold'
  | 'shortcutEsc'
  | 'splitPayment'
  | 'splitTotal'
  | 'splitMustMatch'
  | 'kitchenNotes'
  | 'customNote'
  | 'tapForNotes'
  | 'customItem'
  | 'addToCart'
  | 'stockIn'
  | 'stockInSuccess'
  | 'selectProduct'
  | 'optional'
  | 'lowStockFilter'
  | 'activityLog'
  | 'activityLogDesc'
  | 'noAuditLogs'
  | 'stockAlerts'
  | 'minStockAlert'
  | 'minStockAlertDesc'
  | 'resetTokenCounter'
  | 'resetTokenConfirm'
  | 'tokenResetDone'
  | 'email'
  | 'password'
  | 'signIn'
  | 'signOut'
  | 'loginSubtitle'
  | 'loginOfflineHint'
  | 'loginSuccess'
  | 'loginFailed'
  | 'syncNow'
  | 'syncDone'
  | 'syncIdle'
  | 'liveCloud'
  | 'liveCloudDesc'
  | 'liveCloudError'
  | 'liveCloudNoShop'
  | 'refresh'
  | 'paymentBreakdown'
  | 'recentOrders'
  | 'superAdminTitle'
  | 'superAdminHint'
  | 'licenseExpiringSoon'
  | 'licenseGraceBanner'
  | 'licenseRenewWhatsApp'
  | 'clockTamperTitle'
  | 'clockTamperBody'
  | 'clockVerified'
  | 'clockVerifyFailed'
  | 'verifyOnlineNow'
  | 'renewalTitle'
  | 'renewalBody'
  | 'expiryDate'
  | 'iPaidCheckOnline'
  | 'offlineUnlockHint'
  | 'enterUnlockCode'
  | 'renewalHistorySafe'
  | 'unlockSuccess'
  | 'unlockFailed'
  | 'licenseRefreshed'
  | 'licenseRefreshFailed'
  | 'billingLocked'
  | 'upgradeToPro'
  | 'featureLocked'
  | 'ownerName'
  | 'status'
  | 'actions'
  | 'copied'
  | 'done'
  | 'manage'
  | 'paymentMethod'
  | 'bankTransfer'
  | 'daysAdded'
  | 'lastSynced'
  | 'adminShopsDirectory'
  | 'adminOnboardShop'
  | 'adminOnboardDesc'
  | 'adminCreateShop'
  | 'adminShopCreated'
  | 'adminCreateFailed'
  | 'adminWelcomeCredentials'
  | 'copyCredentials'
  | 'adminPlan'
  | 'planBasic'
  | 'planPro'
  | 'trialDays'
  | 'adminSearchShops'
  | 'adminNoShops'
  | 'adminLoadFailed'
  | 'adminActionFailed'
  | 'adminQuickRenew'
  | 'renewPlus7'
  | 'renewPlus30'
  | 'renewPlus90'
  | 'renewPlusYear'
  | 'adminRenewed'
  | 'suspendShop'
  | 'reactivateShop'
  | 'adminSuspended'
  | 'adminReactivated'
  | 'whatsappReminder'
  | 'adminFeatureFlags'
  | 'adminFlagsSaved'
  | 'adminPlanUpdated'
  | 'adminLogPayment'
  | 'adminPaymentLogged'
  | 'adminUnlockGenerator'
  | 'adminUnlockHint'
  | 'generateUnlockCode'
  | 'unlockCodeCopied'
  | 'flagKhata'
  | 'flagWhatsApp'
  | 'flagAudit'
  | 'flagSplit'
  | 'flagInventory'
  | 'filterAll'
  | 'filterActive'
  | 'filterTrial'
  | 'filterExpiring'
  | 'filterSuspended'
  | 'kpiTotalShops'
  | 'kpiActiveShops'
  | 'kpiTrialShops'
  | 'kpiExpiringSoon'
  | 'kpiSuspended'
  | 'kpiRevenueMonth'
  | 'setByAdmin'
  | 'adminNavOverview'
  | 'adminNavPayments'
  | 'adminNavSectionMain'
  | 'adminNavSectionShops'
  | 'adminNavSectionBilling'
  | 'collapseSidebar'
  | 'adminLiveUpdates'
  | 'adminNoPayments'
  | 'adminPaymentLive'
  | 'validationFixForm'
  | 'validationMin2'
  | 'validationMax80'
  | 'validationEmail'
  | 'validationPhone'
  | 'validationPasswordMin'
  | 'validationPasswordMax'
  | 'validationTrialDays'
  | 'validationAmountPositive'
  | 'validationAmountMax'
  | 'validationDaysRange'
  | 'validationDatePast'
  | 'confirmCreateShopTitle'
  | 'confirmCreateShopBody'
  | 'confirmRenewTitle'
  | 'confirmRenewBody'
  | 'confirmSuspendTitle'
  | 'confirmSuspendBody'
  | 'confirmReactivateTitle'
  | 'confirmReactivateBody'
  | 'confirmPlanTitle'
  | 'confirmPlanBody'
  | 'confirmPaymentTitle'
  | 'confirmPaymentBody'
  | 'confirmFlagTitle'
  | 'confirmFlagBody'

export type Dictionary = Record<TranslationKey, string>

export const en: Dictionary = {
  appName: 'Local POS',
  pos: 'POS',
  orders: 'Orders',
  products: 'Products',
  expenses: 'Expenses',
  khata: 'Khata',
  reports: 'Day Close',
  settings: 'Settings',
  onlineSynced: 'Online (Synced)',
  offlineLocal: 'Offline Mode (Local Saved)',
  pendingSync: 'pending',
  language: 'Language',
  english: 'English',
  urdu: 'Urdu',
  cashierMode: 'Cashier Mode',
  ownerMode: 'Owner Mode',
  lockOwner: 'Lock Owner',
  unlockOwner: 'Unlock Owner',
  enterOwnerPin: 'Enter Owner PIN',
  ownerPinHint: 'Required for settings, voids, price edits & profit reports',
  pinIncorrect: 'Incorrect PIN. Try again.',
  confirm: 'Confirm',
  cancel: 'Cancel',
  continue: 'Continue',
  back: 'Back',
  finish: 'Finish Setup',
  skip: 'Skip',
  loading: 'Loading…',
  comingSoon: 'Coming in next phase',
  modulePlaceholder: 'This module will be built in a later phase.',
  onboardingWelcome: 'Welcome to Local POS',
  onboardingSubtitle:
    'Set up your shop once. Everything saves on this device — works fully offline.',
  chooseBusiness: 'What kind of shop do you run?',
  businessFood: 'Food / Restaurant',
  businessFoodDesc: 'Biryani, fast food, dhaba — tokens, KOT & order types',
  businessRetail: 'General Store / Retail',
  businessRetailDesc: 'Kiryana, garments — barcode, stock & weights',
  businessBakery: 'Bakery / Sweets',
  businessBakeryDesc: 'Weight presets, unit items & optional tokens',
  shopDetails: 'Shop details',
  shopName: 'Shop name',
  shopAddress: 'Address',
  shopPhone: 'Phone number',
  ownerWhatsApp: 'Owner WhatsApp (for day closing)',
  chooseLanguage: 'Preferred language',
  loadDemoData: 'Load sample demo items?',
  loadDemoDataDesc:
    'Instantly add realistic Pakistani shop products so you can test billing right away.',
  yesLoadDemo: 'Yes, load demo items',
  startEmpty: 'Start with empty catalog',
  setupComplete: 'You are ready!',
  setupCompleteDesc: 'Your shop is set up. Start billing from the POS screen.',
  requiredField: 'Please fill this field',
  menu: 'Menu',
  today: 'Today',
  logoutOwner: 'Switch to Cashier',
  searchProducts: 'Search products',
  barcodeSku: 'Barcode / SKU',
  allCategories: 'All',
  cart: 'Cart',
  emptyCart: 'Cart is empty — tap items to add',
  subtotal: 'Subtotal',
  discount: 'Discount',
  total: 'Total',
  payPrint: 'Pay & Print',
  holdOrder: 'Hold / Park',
  heldOrders: 'Held orders',
  resume: 'Resume',
  clearCart: 'Clear',
  qty: 'Qty',
  price: 'Price',
  stock: 'Stock',
  lowStock: 'Low stock',
  cash: 'Cash',
  onlinePay: 'Online / JazzCash',
  udhaar: 'Udhaar',
  exact: 'Exact',
  changeDue: 'Change',
  cashReceived: 'Cash received',
  dineIn: 'Dine-In',
  takeaway: 'Parcel',
  delivery: 'Delivery',
  orderType: 'Order type',
  selectVariant: 'Select size / portion',
  selectWeight: 'Select weight',
  addProduct: 'Add product',
  editProduct: 'Edit product',
  deleteProduct: 'Delete product',
  addCategory: 'Add category',
  editCategory: 'Edit category',
  categories: 'Categories',
  productName: 'Product name',
  category: 'Category',
  costPrice: 'Cost price',
  sku: 'SKU / Barcode',
  unit: 'Unit',
  trackStock: 'Track stock',
  fractionalQty: 'Allow fractional qty',
  variants: 'Variants',
  save: 'Save',
  delete: 'Delete',
  noProducts: 'No products yet. Add some or load demo data in Settings.',
  noCategories: 'No categories yet',
  color: 'Color',
  image: 'Image',
  uploadImage: 'Upload image',
  active: 'Active',
  inactive: 'Inactive',
  orderSaved: 'Bill saved locally',
  orderHeld: 'Order parked',
  cartRestored: 'Held order restored',
  ownerRequiredPrices: 'Owner PIN required to edit prices',
  items: 'items',
  viewCart: 'View cart',
  checkout: 'Checkout',
  weightPresets: 'Weight presets',
  addVariant: 'Add variant',
  variantName: 'Variant name',
  searchOrScan: 'Search or scan barcode…',
  parked: 'Parked',
  deleteConfirm: 'Delete this item?',
  productSaved: 'Product saved',
  categorySaved: 'Category saved',
  deleted: 'Deleted',
  notFoundSku: 'No product found for this SKU',
  receiptSettings: 'Receipt & printer',
  printerWidth: 'Printer width',
  receiptPreview: 'Live receipt preview',
  showLogo: 'Show shop logo',
  showToken: 'Show token number',
  showOrderType: 'Show order type',
  showTax: 'Show tax',
  showSku: 'Show item rate / SKU columns',
  showUdhaarBalance: 'Show udhaar balance',
  showItemDiscount: 'Show item discounts',
  autoPrintKot: 'Auto-print KOT (kitchen slip)',
  taxPercent: 'Tax %',
  footerMessage: 'Footer message',
  uploadLogo: 'Upload logo',
  removeLogo: 'Remove logo',
  ownerPin: 'Owner PIN',
  changePin: 'Change PIN',
  newPin: 'New 4-digit PIN',
  confirmPin: 'Confirm PIN',
  pinUpdated: 'Owner PIN updated',
  settingsSaved: 'Settings saved',
  businessType: 'Business type',
  testPrint: 'Test print',
  kotPreview: 'KOT preview',
  shopProfile: 'Shop profile',
  mm58: '58mm',
  mm80: '80mm',
  printing: 'Sending to printer…',
  todayOrders: "Today's orders",
  allOrders: 'All orders',
  reprint: 'Reprint',
  reprintKot: 'Reprint KOT',
  voidBill: 'Void bill',
  voided: 'Voided',
  voidSuccess: 'Bill voided',
  addExpense: 'Add expense',
  expenseTitle: 'Title',
  expenseCategory: 'Category',
  amount: 'Amount',
  note: 'Note',
  noOrders: 'No orders found',
  noExpenses: 'No expenses yet',
  customers: 'Customers',
  addCustomer: 'Add customer',
  customerName: 'Customer name',
  balance: 'Balance',
  wasooli: 'Wasooli',
  recordPayment: 'Record payment',
  ledger: 'Ledger',
  noCustomers: 'No customers yet',
  selectCustomer: 'Select customer',
  dayClosing: 'Day closing',
  openingCash: 'Opening cash',
  cashSales: 'Cash sales',
  onlineSales: 'Online sales',
  udhaarSales: 'Udhaar sales',
  totalExpenses: 'Total expenses',
  khataReceived: 'Khata cash received',
  expectedCash: 'Expected cash in drawer',
  actualCash: 'Actual cash counted',
  sendWhatsApp: 'Send on WhatsApp',
  saveClosing: 'Save day closing',
  closingSaved: 'Day closing saved',
  exportBackup: 'Export full backup (.json)',
  restoreBackup: 'Restore from backup',
  backupExported: 'Backup downloaded',
  backupRestored: 'Backup restored',
  backupSection: 'Backup & restore',
  backupWarning: 'Restore replaces all local data on this device.',
  filterDate: 'Date',
  completed: 'Completed',
  debit: 'Debit',
  credit: 'Credit',
  viewHeld: 'View held',
  heldCount: 'held',
  resumeOrder: 'Resume order',
  discardHeld: 'Discard',
  cartHasItems: 'Current cart has items. Replace with this held order?',
  replaceAndResume: 'Replace & resume',
  noHeldOrders: 'No held orders',
  backupReminder:
    'No JSON backup in the last 7 days. Export a backup to keep your shop data safe.',
  last7Days: 'Last 7 days',
  last30Days: 'Last 30 days',
  customRange: 'Custom',
  loadMore: 'Load more',
  shortcutGuide: 'Keyboard shortcuts',
  shortcutSearch: 'Focus search / barcode',
  shortcutOrderType: 'Toggle Dine-In / Takeaway',
  shortcutCheckout: 'Pay & Print',
  shortcutHold: 'Hold / park order',
  shortcutEsc: 'Close modals',
  splitPayment: 'Split Payment',
  splitTotal: 'Split sum',
  splitMustMatch: 'Split amounts must equal bill total',
  kitchenNotes: 'Kitchen notes',
  customNote: 'Custom note…',
  tapForNotes: 'Tap for notes',
  customItem: 'Custom Item',
  addToCart: 'Add to cart',
  stockIn: 'Stock In (Maal Aaya)',
  stockInSuccess: 'Stock updated',
  selectProduct: 'Select product',
  optional: 'optional',
  lowStockFilter: 'Low Stock',
  activityLog: 'Activity / Security Log',
  activityLogDesc: 'Owner audit trail for voids, discounts, PIN fails & more',
  noAuditLogs: 'No security events yet',
  stockAlerts: 'Stock & tokens',
  minStockAlert: 'Low-stock alert threshold',
  minStockAlertDesc: 'Red badge when stock is at or below this number',
  resetTokenCounter: 'Reset Token Counter',
  resetTokenConfirm: 'Reset token so the next bill starts at #1?',
  tokenResetDone: 'Token counter reset',
  email: 'Email',
  password: 'Password',
  signIn: 'Sign in',
  signOut: 'Sign out',
  loginSubtitle: 'Sign in to sync your shop securely',
  loginOfflineHint:
    'Once signed in, the app works offline. Open again tomorrow without internet.',
  loginSuccess: 'Signed in',
  loginFailed: 'Login failed',
  syncNow: 'Sync Now',
  syncDone: 'Synced to cloud',
  syncIdle: 'Nothing pending to sync',
  liveCloud: 'Live Cloud Summary',
  liveCloudDesc: 'Read-only today view from the cloud (does not change counter data)',
  liveCloudError: 'Could not load cloud summary',
  liveCloudNoShop: 'No shop linked to this account',
  refresh: 'Refresh',
  paymentBreakdown: 'Payment breakdown',
  recentOrders: 'Recent orders',
  superAdminTitle: 'Super Admin',
  superAdminHint: 'Platform admin portal for shops, licenses, and billing.',
  licenseExpiringSoon:
    'License expires in {days} day(s). Renew soon to keep billing unrestricted.',
  licenseGraceBanner:
    'License expired — grace period: {days} day(s) left. Billing still works; renew to avoid lock.',
  licenseRenewWhatsApp: 'Hi, I need to renew my Local POS license.',
  clockTamperTitle: 'Device clock changed',
  clockTamperBody:
    'The system clock went backwards. Billing is paused until we verify the time with the server.',
  clockVerified: 'Clock verified — billing restored',
  clockVerifyFailed: 'Could not verify online. Connect to the internet and try again.',
  verifyOnlineNow: 'Verify online now',
  renewalTitle: 'License renewal required',
  renewalBody:
    'Billing is soft-locked. Your sales history stays safe. Renew or enter an unlock code.',
  expiryDate: 'Expiry',
  iPaidCheckOnline: 'I paid — check online',
  offlineUnlockHint: 'No internet? Enter the offline unlock code from support:',
  enterUnlockCode: 'Unlock with code',
  renewalHistorySafe: 'Orders, khata, and reports are not deleted.',
  unlockSuccess: 'Unlocked — thank you',
  unlockFailed: 'Invalid or expired unlock code',
  licenseRefreshed: 'License updated from cloud',
  licenseRefreshFailed: 'Could not refresh license. Try Sync Now when online.',
  billingLocked: 'Billing is locked until license is renewed',
  upgradeToPro: 'Upgrade to Pro',
  featureLocked: 'This feature is not on your plan',
  ownerName: 'Owner name',
  status: 'Status',
  actions: 'Actions',
  copied: 'Copied',
  done: 'Done',
  manage: 'Manage',
  paymentMethod: 'Payment method',
  bankTransfer: 'Bank transfer',
  daysAdded: 'Days added',
  lastSynced: 'Last synced',
  adminShopsDirectory: 'Shops directory',
  adminOnboardShop: 'Onboard shop',
  adminOnboardDesc:
    'Creates a shop row, owner login, and trial license via the secure edge function.',
  adminCreateShop: 'Create shop & owner',
  adminShopCreated: 'Shop created',
  adminCreateFailed: 'Could not create shop',
  adminWelcomeCredentials: 'Welcome credentials (share once)',
  copyCredentials: 'Copy credentials',
  adminPlan: 'Plan',
  planBasic: 'Basic',
  planPro: 'Pro',
  trialDays: 'Trial days',
  adminSearchShops: 'Search shop or phone…',
  adminNoShops: 'No shops match this filter',
  adminLoadFailed: 'Could not load shops',
  adminActionFailed: 'Action failed',
  adminQuickRenew: 'Quick renew',
  renewPlus7: '+7 days',
  renewPlus30: '+30 days',
  renewPlus90: '+90 days',
  renewPlusYear: '+1 year',
  adminRenewed: 'License extended',
  suspendShop: 'Suspend shop',
  reactivateShop: 'Reactivate',
  adminSuspended: 'Shop suspended',
  adminReactivated: 'Shop reactivated',
  whatsappReminder: 'WhatsApp reminder',
  adminFeatureFlags: 'Feature flags',
  adminFlagsSaved: 'Feature flags updated',
  adminPlanUpdated: 'Plan updated',
  adminLogPayment: 'Log payment',
  adminPaymentLogged: 'Payment logged & license extended',
  adminUnlockGenerator: 'Offline unlock code',
  adminUnlockHint:
    'Share this code when the shop is offline and soft-locked. Format POS-YYYYMMDD-XXXXXX.',
  generateUnlockCode: 'Generate & copy code',
  unlockCodeCopied: 'Unlock code copied',
  flagKhata: 'Khata / Udhaar',
  flagWhatsApp: 'WhatsApp day report',
  flagAudit: 'Activity / audit log',
  flagSplit: 'Split payment',
  flagInventory: 'Inventory / stock-in',
  filterAll: 'All',
  filterActive: 'Active',
  filterTrial: 'Trial',
  filterExpiring: 'Expiring soon',
  filterSuspended: 'Suspended',
  kpiTotalShops: 'Total shops',
  kpiActiveShops: 'Active',
  kpiTrialShops: 'Trial',
  kpiExpiringSoon: 'Expiring ≤5d',
  kpiSuspended: 'Suspended',
  kpiRevenueMonth: 'Revenue (month)',
  setByAdmin: 'set by admin',
  adminNavOverview: 'Overview',
  adminNavPayments: 'Payments',
  adminNavSectionMain: 'Main',
  adminNavSectionShops: 'Shops',
  adminNavSectionBilling: 'Billing',
  collapseSidebar: 'Collapse',
  adminLiveUpdates: 'Live updates on',
  adminNoPayments: 'No payments yet this period',
  adminPaymentLive: 'New payment received',
  validationFixForm: 'Please fix the highlighted fields',
  validationMin2: 'At least 2 characters',
  validationMax80: 'Max 80 characters',
  validationEmail: 'Enter a valid email',
  validationPhone: 'Use a valid PK mobile (03xxxxxxxxx)',
  validationPasswordMin: 'Password must be at least 6 characters',
  validationPasswordMax: 'Password is too long',
  validationTrialDays: 'Trial days must be 1–365',
  validationAmountPositive: 'Amount must be greater than 0',
  validationAmountMax: 'Amount is too large',
  validationDaysRange: 'Days must be 1–3650',
  validationDatePast: 'Expiry date cannot be in the past',
  confirmCreateShopTitle: 'Create this shop?',
  confirmCreateShopBody:
    'Create "{shop}" and owner login {email}? Credentials will be shown once.',
  confirmRenewTitle: 'Extend license?',
  confirmRenewBody: 'Add {days} day(s) to "{shop}" and set status to active?',
  confirmSuspendTitle: 'Suspend shop?',
  confirmSuspendBody:
    '"{shop}" will be soft-locked for billing until reactivated.',
  confirmReactivateTitle: 'Reactivate shop?',
  confirmReactivateBody: 'Set "{shop}" status back to active?',
  confirmPlanTitle: 'Change plan?',
  confirmPlanBody:
    'Switch "{shop}" to {plan}? Default feature flags for that plan will apply.',
  confirmPaymentTitle: 'Log payment?',
  confirmPaymentBody:
    'Record {amount} and add {days} day(s) for "{shop}"?',
  confirmFlagTitle: 'Update feature flag?',
  confirmFlagBody: 'Toggle "{flag}" for this shop?',
}

export const ur: Dictionary = {
  appName: 'لوکل پی او ایس',
  pos: 'بلنگ',
  orders: 'آرڈرز',
  products: 'مصنوعات',
  expenses: 'اخراجات',
  khata: 'کھاتہ',
  reports: 'دن کی بندش',
  settings: 'ترتیبات',
  onlineSynced: 'آن لائن (سنک)',
  offlineLocal: 'آف لائن (محفوظ)',
  pendingSync: 'زیر التوا',
  language: 'زبان',
  english: 'انگریزی',
  urdu: 'اردو',
  cashierMode: 'کیشیئر موڈ',
  ownerMode: 'مالک موڈ',
  lockOwner: 'مالک لاک',
  unlockOwner: 'مالک ان لاک',
  enterOwnerPin: 'مالک کا پن درج کریں',
  ownerPinHint: 'ترتیبات، بل منسوخ، قیمتیں اور منافع کے لیے ضروری',
  pinIncorrect: 'غلط پن۔ دوبارہ کوشش کریں۔',
  confirm: 'تصدیق',
  cancel: 'منسوخ',
  continue: 'آگے',
  back: 'پیچھے',
  finish: 'سیٹ اپ مکمل',
  skip: 'چھوڑیں',
  loading: 'لوڈ ہو رہا ہے…',
  comingSoon: 'اگلے مرحلے میں آئے گا',
  modulePlaceholder: 'یہ ماڈیول اگلے مرحلے میں بنایا جائے گا۔',
  onboardingWelcome: 'لوکل پی او ایس میں خوش آمدید',
  onboardingSubtitle:
    'ایک بار دکان سیٹ کریں۔ سب کچھ اس ڈیوائس پر محفوظ رہے گا — مکمل آف لائن۔',
  chooseBusiness: 'آپ کی دکان کس قسم کی ہے؟',
  businessFood: 'کھانا / ریسٹورنٹ',
  businessFoodDesc: 'بریانی، فاسٹ فوڈ — ٹوکن، کے او ٹی اور آرڈر ٹائپ',
  businessRetail: 'جنرل سٹور / ریٹیل',
  businessRetailDesc: 'کریانہ، کپڑے — بارکوڈ، اسٹاک اور وزن',
  businessBakery: 'بیکری / مٹھائی',
  businessBakeryDesc: 'وزن بٹن، یونٹ آئٹمز اور اختیاری ٹوکن',
  shopDetails: 'دکان کی تفصیل',
  shopName: 'دکان کا نام',
  shopAddress: 'پتہ',
  shopPhone: 'فون نمبر',
  ownerWhatsApp: 'مالک واٹس ایپ (دن کی بندش کے لیے)',
  chooseLanguage: 'پسندیدہ زبان',
  loadDemoData: 'نمونہ آئٹمز لوڈ کریں؟',
  loadDemoDataDesc:
    'فوری طور پر پاکستانی دکان کی مصنوعات شامل کریں تاکہ بلنگ آزما سکیں۔',
  yesLoadDemo: 'ہاں، ڈیمو آئٹمز لوڈ کریں',
  startEmpty: 'خالی کیٹلاگ سے شروع کریں',
  setupComplete: 'آپ تیار ہیں!',
  setupCompleteDesc: 'دکان سیٹ ہو گئی۔ بلنگ اسکرین سے شروع کریں۔',
  requiredField: 'براہ کرم یہ خانہ بھریں',
  menu: 'مینو',
  today: 'آج',
  logoutOwner: 'کیشیئر موڈ',
  searchProducts: 'مصنوعات تلاش کریں',
  barcodeSku: 'بارکوڈ / ایس کے یو',
  allCategories: 'سب',
  cart: 'کارٹ',
  emptyCart: 'کارٹ خالی ہے — آئٹم پر ٹیپ کریں',
  subtotal: 'ذیلی کل',
  discount: 'رعایت',
  total: 'کل',
  payPrint: 'ادائیگی اور پرنٹ',
  holdOrder: 'ہولڈ / پارک',
  heldOrders: 'ہولڈ آرڈرز',
  resume: 'دوبارہ کھولیں',
  clearCart: 'صاف',
  qty: 'مقدار',
  price: 'قیمت',
  stock: 'اسٹاک',
  lowStock: 'کم اسٹاک',
  cash: 'نقد',
  onlinePay: 'آن لائن / جازکیش',
  udhaar: 'ادھار',
  exact: 'بالکل',
  changeDue: 'واپسی',
  cashReceived: 'موصول نقد',
  dineIn: 'ہال میں',
  takeaway: 'پارسل',
  delivery: 'ڈیلیوری',
  orderType: 'آرڈر قسم',
  selectVariant: 'سائز / پورشن منتخب کریں',
  selectWeight: 'وزن منتخب کریں',
  addProduct: 'نیا پروڈکٹ',
  editProduct: 'پروڈکٹ ترمیم',
  deleteProduct: 'پروڈکٹ حذف',
  addCategory: 'نیا زمرہ',
  editCategory: 'زمرہ ترمیم',
  categories: 'زمرے',
  productName: 'نام',
  category: 'زمرہ',
  costPrice: 'لاگت',
  sku: 'اس کے یو / بارکوڈ',
  unit: 'یونٹ',
  trackStock: 'اسٹاک ٹریک کریں',
  fractionalQty: 'جزوی مقدار',
  variants: 'اقسام',
  save: 'محفوظ',
  delete: 'حذف',
  noProducts: 'ابھی کوئی پروڈکٹ نہیں',
  noCategories: 'ابھی کوئی زمرہ نہیں',
  color: 'رنگ',
  image: 'تصویر',
  uploadImage: 'تصویر اپ لوڈ',
  active: 'فعال',
  inactive: 'غیر فعال',
  orderSaved: 'بل محفوظ ہو گیا',
  orderHeld: 'آرڈر پارک ہو گیا',
  cartRestored: 'ہولڈ آرڈر بحال',
  ownerRequiredPrices: 'قیمت ترمیم کے لیے مالک پن ضروری',
  items: 'آئٹمز',
  viewCart: 'کارٹ دیکھیں',
  checkout: 'چیک آؤٹ',
  weightPresets: 'وزن بٹن',
  addVariant: 'ویرینٹ شامل',
  variantName: 'ویرینٹ نام',
  searchOrScan: 'تلاش یا بارکوڈ اسکین…',
  parked: 'پارک شدہ',
  deleteConfirm: 'کیا حذف کریں؟',
  productSaved: 'پروڈکٹ محفوظ',
  categorySaved: 'زمرہ محفوظ',
  deleted: 'حذف ہو گیا',
  notFoundSku: 'اس ایس کے یو کا پروڈکٹ نہیں ملا',
  receiptSettings: 'رسید اور پرنٹر',
  printerWidth: 'پرنٹر چوڑائی',
  receiptPreview: 'لائیو رسید پیش منظر',
  showLogo: 'لوگو دکھائیں',
  showToken: 'ٹوکن نمبر',
  showOrderType: 'آرڈر قسم',
  showTax: 'ٹیکس دکھائیں',
  showSku: 'ریٹ / ایس کے یو کالم',
  showUdhaarBalance: 'ادھار بیلنس',
  showItemDiscount: 'آئٹم رعایت',
  autoPrintKot: 'خودکار کے او ٹی پرنٹ',
  taxPercent: 'ٹیکس ٪',
  footerMessage: 'فوٹر پیغام',
  uploadLogo: 'لوگو اپ لوڈ',
  removeLogo: 'لوگو ہٹائیں',
  ownerPin: 'مالک پن',
  changePin: 'پن تبدیل',
  newPin: 'نیا 4 ہندسوں کا پن',
  confirmPin: 'پن تصدیق',
  pinUpdated: 'مالک پن اپ ڈیٹ',
  settingsSaved: 'ترتیبات محفوظ',
  businessType: 'کاروبار کی قسم',
  testPrint: 'ٹیسٹ پرنٹ',
  kotPreview: 'کے او ٹی پیش منظر',
  shopProfile: 'دکان پروفائل',
  mm58: '58mm',
  mm80: '80mm',
  printing: 'پرنٹر کو بھیجا جا رہا ہے…',
  todayOrders: 'آج کے آرڈرز',
  allOrders: 'تمام آرڈرز',
  reprint: 'دوبارہ پرنٹ',
  reprintKot: 'کے او ٹی پرنٹ',
  voidBill: 'بل منسوخ',
  voided: 'منسوخ',
  voidSuccess: 'بل منسوخ ہو گیا',
  addExpense: 'اخراجات شامل',
  expenseTitle: 'عنوان',
  expenseCategory: 'زمرہ',
  amount: 'رقم',
  note: 'نوٹ',
  noOrders: 'کوئی آرڈر نہیں',
  noExpenses: 'ابھی کوئی اخراجات نہیں',
  customers: 'گاہک',
  addCustomer: 'گاہک شامل',
  customerName: 'گاہک کا نام',
  balance: 'بیلنس',
  wasooli: 'وصولی',
  recordPayment: 'ادائیگی درج',
  ledger: 'کھاتہ',
  noCustomers: 'ابھی کوئی گاہک نہیں',
  selectCustomer: 'گاہک منتخب کریں',
  dayClosing: 'دن کی بندش',
  openingCash: 'ابتدائی نقد',
  cashSales: 'نقد فروخت',
  onlineSales: 'آن لائن فروخت',
  udhaarSales: 'ادھار فروخت',
  totalExpenses: 'کل اخراجات',
  khataReceived: 'کھاتہ وصولی',
  expectedCash: 'ڈراور میں متوقع نقد',
  actualCash: 'اصل شمار شدہ نقد',
  sendWhatsApp: 'واٹس ایپ پر بھیجیں',
  saveClosing: 'بندش محفوظ',
  closingSaved: 'دن کی بندش محفوظ',
  exportBackup: 'مکمل بیک اپ (.json)',
  restoreBackup: 'بیک اپ سے بحالی',
  backupExported: 'بیک اپ ڈاؤن لوڈ',
  backupRestored: 'بیک اپ بحال',
  backupSection: 'بیک اپ اور بحالی',
  backupWarning: 'بحالی اس ڈیوائس کا سارا ڈیٹا بدل دے گی۔',
  filterDate: 'تاریخ',
  completed: 'مکمل',
  debit: 'ڈیبٹ',
  credit: 'کریڈٹ',
  viewHeld: 'ہولڈ دیکھیں',
  heldCount: 'ہولڈ',
  resumeOrder: 'آرڈر دوبارہ کھولیں',
  discardHeld: 'حذف',
  cartHasItems: 'موجودہ کارٹ میں آئٹمز ہیں۔ اس ہولڈ آرڈر سے بدل دیں؟',
  replaceAndResume: 'بدل کر کھولیں',
  noHeldOrders: 'کوئی ہولڈ آرڈر نہیں',
  backupReminder:
    'پچھلے 7 دن میں کوئی JSON بیک اپ نہیں۔ دکان کا ڈیٹا محفوظ رکھنے کے لیے بیک اپ لیں۔',
  last7Days: 'آخری 7 دن',
  last30Days: 'آخری 30 دن',
  customRange: 'حسبِ ضرورت',
  loadMore: 'مزید لوڈ کریں',
  shortcutGuide: 'کی بورڈ شارٹ کٹس',
  shortcutSearch: 'سرچ / بارکوڈ فوکس',
  shortcutOrderType: 'ڈائن اِن / ٹیک اوے',
  shortcutCheckout: 'ادائیگی اور پرنٹ',
  shortcutHold: 'آرڈر ہولڈ',
  shortcutEsc: 'ماڈل بند',
  splitPayment: 'تقسیم ادائیگی',
  splitTotal: 'تقسیم کل',
  splitMustMatch: 'تقسیم رقم بل کے برابر ہونی چاہیے',
  kitchenNotes: 'کچن نوٹس',
  customNote: 'اپنی نوٹ…',
  tapForNotes: 'نوٹ کے لیے ٹیپ',
  customItem: 'کسٹم آئٹم',
  addToCart: 'کارٹ میں شامل',
  stockIn: 'اسٹاک اِن (مال آیا)',
  stockInSuccess: 'اسٹاک اپ ڈیٹ',
  selectProduct: 'مصنوعات منتخب کریں',
  optional: 'اختیاری',
  lowStockFilter: 'کم اسٹاک',
  activityLog: 'سرگرمی / سیکیورٹی لاگ',
  activityLogDesc: 'منسوخی، رعایت، غلط پن اور دیگر کے مالک لاگز',
  noAuditLogs: 'ابھی کوئی سیکیورٹی ایونٹ نہیں',
  stockAlerts: 'اسٹاک اور ٹوکن',
  minStockAlert: 'کم اسٹاک الرٹ حد',
  minStockAlertDesc: 'اس تعداد یا اس سے کم پر سرخ بیج',
  resetTokenCounter: 'ٹوکن کاؤنٹر ری سیٹ',
  resetTokenConfirm: 'اگلا بل #1 سے شروع ہو؟ ٹوکن ری سیٹ کریں؟',
  tokenResetDone: 'ٹوکن کاؤنٹر ری سیٹ ہو گیا',
  email: 'ای میل',
  password: 'پاس ورڈ',
  signIn: 'سائن اِن',
  signOut: 'سائن آؤٹ',
  loginSubtitle: 'اپنی دکان محفوظ طریقے سے سنک کرنے کے لیے سائن اِن کریں',
  loginOfflineHint:
    'سائن اِن کے بعد ایپ آف لائن چلتی ہے۔ کل انٹرنیٹ کے بغیر بھی کھول سکتے ہیں۔',
  loginSuccess: 'سائن اِن کامیاب',
  loginFailed: 'سائن اِن ناکام',
  syncNow: 'ابھی سنک کریں',
  syncDone: 'کلاؤڈ پر سنک ہو گیا',
  syncIdle: 'سنک کے لیے کچھ نہیں',
  liveCloud: 'لائیو کلاؤڈ خلاصہ',
  liveCloudDesc: 'کلاؤڈ سے آج کا صرف پڑھنے والا خلاصہ (کاؤنٹر ڈیٹا نہیں بدلتا)',
  liveCloudError: 'کلاؤڈ خلاصہ لوڈ نہیں ہو سکا',
  liveCloudNoShop: 'اس اکاؤنٹ سے کوئی دکان منسلک نہیں',
  refresh: 'تازہ کریں',
  paymentBreakdown: 'ادائیگی کی تفصیل',
  recentOrders: 'حالیہ آرڈرز',
  superAdminTitle: 'سپر ایڈمن',
  superAdminHint: 'دکانیں، لائسنس اور بلنگ کے لیے پلیٹ فارم ایڈمن پورٹل۔',
  licenseExpiringSoon:
    'لائسنس {days} دن میں ختم ہوگا۔ بلنگ بلا رکاوٹ رکھنے کے لیے جلد تجدید کریں۔',
  licenseGraceBanner:
    'لائسنس ختم — رعایت مدت: {days} دن باقی۔ بلنگ ابھی چلتی ہے؛ لاک سے بچنے کے لیے تجدید کریں۔',
  licenseRenewWhatsApp: 'السلام علیکم، مجھے لوکل پی او ایس لائسنس تجدید کرنی ہے۔',
  clockTamperTitle: 'ڈیوائس کی گھڑی بدل گئی',
  clockTamperBody:
    'سسٹم کلاک پیچھے چلی۔ سرور سے وقت تصدیق ہونے تک بلنگ روک دی گئی ہے۔',
  clockVerified: 'گھڑی تصدیق ہو گئی — بلنگ بحال',
  clockVerifyFailed: 'آن لائن تصدیق نہ ہو سکی۔ انٹرنیٹ لگائیں اور دوبارہ کوشش کریں۔',
  verifyOnlineNow: 'ابھی آن لائن تصدیق کریں',
  renewalTitle: 'لائسنس تجدید ضروری ہے',
  renewalBody:
    'بلنگ عارضی طور پر لاک ہے۔ آپ کی تاریخ محفوظ ہے۔ تجدید کریں یا ان لاک کوڈ درج کریں۔',
  expiryDate: 'ختم ہونے کی تاریخ',
  iPaidCheckOnline: 'ادائیگی ہو گئی — آن لائن چیک کریں',
  offlineUnlockHint: 'انٹرنیٹ نہیں؟ سپورٹ سے موصول آف لائن ان لاک کوڈ درج کریں:',
  enterUnlockCode: 'کوڈ سے ان لاک',
  renewalHistorySafe: 'آرڈرز، کھاتہ اور رپورٹس حذف نہیں ہوتیں۔',
  unlockSuccess: 'ان لاک ہو گیا — شکریہ',
  unlockFailed: 'غلط یا میعاد ختم ان لاک کوڈ',
  licenseRefreshed: 'کلاؤڈ سے لائسنس اپ ڈیٹ ہو گیا',
  licenseRefreshFailed: 'لائسنس تازہ نہیں ہو سکا۔ آن لائن ہونے پر Sync Now آزمائیں۔',
  billingLocked: 'لائسنس تجدید تک بلنگ لاک ہے',
  upgradeToPro: 'پرو میں اپگریڈ کریں',
  featureLocked: 'یہ فیچر آپ کے پلان میں نہیں',
  ownerName: 'مالک کا نام',
  status: 'حیثیت',
  actions: 'عمل',
  copied: 'کاپی ہو گیا',
  done: 'مکمل',
  manage: 'منتظم کریں',
  paymentMethod: 'ادائیگی کا طریقہ',
  bankTransfer: 'بینک ٹرانسفر',
  daysAdded: 'شامل دن',
  lastSynced: 'آخری سنک',
  adminShopsDirectory: 'دکانوں کی فہرست',
  adminOnboardShop: 'نئی دکان شامل کریں',
  adminOnboardDesc:
    'محفوظ ایج فنکشن سے دکان، مالک لاگ اِن اور ٹرائل لائسنس بناتا ہے۔',
  adminCreateShop: 'دکان اور مالک بنائیں',
  adminShopCreated: 'دکان بن گئی',
  adminCreateFailed: 'دکان نہیں بن سکی',
  adminWelcomeCredentials: 'خوش آمدید تفصیلات (ایک بار شیئر کریں)',
  copyCredentials: 'تفصیلات کاپی کریں',
  adminPlan: 'پلان',
  planBasic: 'بیسک',
  planPro: 'پرو',
  trialDays: 'ٹرائل دن',
  adminSearchShops: 'دکان یا فون تلاش…',
  adminNoShops: 'اس فلٹر سے کوئی دکان نہیں ملی',
  adminLoadFailed: 'دکانیں لوڈ نہیں ہو سکیں',
  adminActionFailed: 'عمل ناکام',
  adminQuickRenew: 'فوری تجدید',
  renewPlus7: '+۷ دن',
  renewPlus30: '+۳۰ دن',
  renewPlus90: '+۹۰ دن',
  renewPlusYear: '+۱ سال',
  adminRenewed: 'لائسنس بڑھا دیا گیا',
  suspendShop: 'دکان معطل',
  reactivateShop: 'بحال کریں',
  adminSuspended: 'دکان معطل ہو گئی',
  adminReactivated: 'دکان بحال ہو گئی',
  whatsappReminder: 'واٹس ایپ یاد دہانی',
  adminFeatureFlags: 'فیچر فلیگز',
  adminFlagsSaved: 'فیچر فلیگز اپ ڈیٹ',
  adminPlanUpdated: 'پلان اپ ڈیٹ',
  adminLogPayment: 'ادائیگی درج کریں',
  adminPaymentLogged: 'ادائیگی درج اور لائسنس بڑھا',
  adminUnlockGenerator: 'آف لائن ان لاک کوڈ',
  adminUnlockHint:
    'جب دکان آف لائن اور سافٹ لاک ہو تو یہ کوڈ بھیجیں۔ فارمیٹ POS-YYYYMMDD-XXXXXX۔',
  generateUnlockCode: 'کوڈ بنائیں اور کاپی کریں',
  unlockCodeCopied: 'ان لاک کوڈ کاپی ہو گیا',
  flagKhata: 'کھاتہ / ادھار',
  flagWhatsApp: 'واٹس ایپ دن کی رپورٹ',
  flagAudit: 'سرگرمی / آڈٹ لاگ',
  flagSplit: 'تقسیم ادائیگی',
  flagInventory: 'انوینٹری / اسٹاک اِن',
  filterAll: 'سب',
  filterActive: 'فعال',
  filterTrial: 'ٹرائل',
  filterExpiring: 'جلد ختم',
  filterSuspended: 'معطل',
  kpiTotalShops: 'کل دکانیں',
  kpiActiveShops: 'فعال',
  kpiTrialShops: 'ٹرائل',
  kpiExpiringSoon: '≤۵ دن میں ختم',
  kpiSuspended: 'معطل',
  kpiRevenueMonth: 'آمدنی (مہینہ)',
  setByAdmin: 'ایڈمن نے سیٹ کیا',
  adminNavOverview: 'جائزہ',
  adminNavPayments: 'ادائیگیاں',
  adminNavSectionMain: 'مرکزی',
  adminNavSectionShops: 'دکانیں',
  adminNavSectionBilling: 'بلنگ',
  collapseSidebar: 'سکیڑیں',
  adminLiveUpdates: 'لائیو اپ ڈیٹس آن',
  adminNoPayments: 'اس مدت میں کوئی ادائیگی نہیں',
  adminPaymentLive: 'نئی ادائیگی موصول',
  validationFixForm: 'نمایاں فیلڈز درست کریں',
  validationMin2: 'کم از کم ۲ حروف',
  validationMax80: 'زیادہ سے زیادہ ۸۰ حروف',
  validationEmail: 'درست ای میل درج کریں',
  validationPhone: 'درست پاکستانی موبائل (03xxxxxxxxx)',
  validationPasswordMin: 'پاس ورڈ کم از کم ۶ حروف',
  validationPasswordMax: 'پاس ورڈ بہت لمبا ہے',
  validationTrialDays: 'ٹرائل دن ۱–۳۶۵ ہوں',
  validationAmountPositive: 'رقم ۰ سے زیادہ ہو',
  validationAmountMax: 'رقم بہت زیادہ ہے',
  validationDaysRange: 'دن ۱–۳۶۵۰ ہوں',
  validationDatePast: 'ختم ہونے کی تاریخ ماضی میں نہیں ہو سکتی',
  confirmCreateShopTitle: 'یہ دکان بنائیں؟',
  confirmCreateShopBody:
    '"{shop}" اور مالک لاگ اِن {email} بنائیں؟ تفصیلات ایک بار دکھیں گی۔',
  confirmRenewTitle: 'لائسنس بڑھائیں؟',
  confirmRenewBody: '"{shop}" میں {days} دن شامل کریں اور فعال کریں؟',
  confirmSuspendTitle: 'دکان معطل کریں؟',
  confirmSuspendBody:
    '"{shop}" بلنگ کے لیے سافٹ لاک ہو جائے گی جب تک بحال نہ کی جائے۔',
  confirmReactivateTitle: 'دکان بحال کریں؟',
  confirmReactivateBody: '"{shop}" کی حیثیت دوبارہ فعال کریں؟',
  confirmPlanTitle: 'پلان تبدیل کریں؟',
  confirmPlanBody:
    '"{shop}" کو {plan} پر لے جائیں؟ اس پلان کے ڈیفالٹ فیچر فلیگز لگ جائیں گے۔',
  confirmPaymentTitle: 'ادائیگی درج کریں؟',
  confirmPaymentBody:
    '"{shop}" کے لیے {amount} درج کریں اور {days} دن شامل کریں؟',
  confirmFlagTitle: 'فیچر فلیگ اپ ڈیٹ؟',
  confirmFlagBody: 'اس دکان کے لیے "{flag}" تبدیل کریں؟',
}

export const dictionaries = { en, ur } as const
