# EJJAR Contractor App

## What This App Does
GCC platform where contractors search for manpower,
machinery/vehicles, and shipping resources.
RFQ is BROADCAST to ALL matching suppliers in the
selected category and region. Not sent to one supplier.
Multiple suppliers respond. Contractor compares and picks best.

## Type
React Native CLI mobile app — iOS and Android
NEVER use Expo under any circumstances.

## Stack
- React Native CLI latest
- TypeScript
- Uniwind (Tailwind CSS for React Native — primary styling)
- react-native-linear-gradient (gradient headers)
- react-native-skeleton-placeholder (loading states)
- React Navigation Stack + Bottom Tabs
- Zustand (state management)
- AsyncStorage
- Axios (mocked — no real API calls)
- i18next + react-i18next
- react-native-localize

## Design Standard
PREMIUM quality — Careem / Talabat / Noon level.
- Dark gradient hero header (#1A4FBA to #143D9B)
- Tailwind classes for ALL styling
- Never use StyleSheet.create()
- Card shadows with shadow-sm shadow-md
- Generous whitespace
- Custom components — no pre-built component libraries

## Colors (use these exact values always)
Primary:        #1A4FBA
Primary Dark:   #143D9B
Primary Light:  #E8EEFB
Success:        #22C55E
Success Light:  #DCFCE7
Warning:        #F59E0B
Warning Light:  #FEF3C7
Error:          #EF4444
Error Light:    #FEE2E2
Background:     #F5F7FA
Card:           #FFFFFF
Text Primary:   #1A1A2E
Text Secondary: #6B7280
Border:         #E5E7EB

## GCC Countries and Cities
Oman: Muscat, Sohar, Salalah, Nizwa, Sur, Duqm
Saudi Arabia: Riyadh, Jeddah, Dammam, Khobar, Jubail
UAE: Dubai, Abu Dhabi, Sharjah, Ajman
Kuwait: Kuwait City, Ahmadi, Hawalli
Bahrain: Manama, Riffa, Muharraq
Qatar: Doha, Al Wakrah, Lusail, Al Rayyan

## Mock Data Location
../../shared/mock/
Files: suppliers.json, contractors.json, resources.json,
rfqs.json, jobs.json, taxonomy.json,
gcc_regions.json, notifications.json, reviews.json

## Language
English (en) and Arabic (ar)
RTL via I18nManager when Arabic selected
Use ps/pe/ms/me instead of pl/pr/ml/mr for RTL safety
Never hardcode any UI string — always use t('key')
Language saved in AsyncStorage key: ejjar_language

## Masking Rules
Pre-confirmation:
  Phone → "●●●● ●●●●"
  Supplier name → "Supplier #" + last 4 chars of ID
  Location → "Central [City] (~X km)"
Post-confirmation (job confirmed or completed):
  Show all real data

## RFQ is Broadcast
Contractor fills requirements
→ RFQ sent to ALL matching suppliers in category + region
→ Multiple suppliers respond
→ Contractor compares all quotes
→ Accepts one → confirms

## Status Flows
RFQ: new → supplier_responded → negotiation
     → accepted → confirmed → completed | rejected
Job: confirmed → in_progress → completed

## RTL Rule
Always use:
  ps-4 pe-4 instead of pl-4 pr-4
  ms-2 me-2 instead of ml-2 mr-2
  self-start/self-end instead of self-left/self-right

## Screens
HomeScreen, SearchResultsScreen, SupplierProfileScreen,
LoginBottomSheet, RFQFormScreen, RFQDetailScreen,
JobTrackingScreen, ReviewScreen, NotificationsScreen,
ProfileScreen, MyRFQsScreen, MyJobsScreen
