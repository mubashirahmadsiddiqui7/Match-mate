# MFD Trace Fish - Technical Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Features & Modules](#features--modules)
4. [User Roles & Authentication](#user-roles--authentication)
5. [Screens & UI Components](#screens--ui-components)
6. [Offline Functionality](#offline-functionality)
7. [API Integration](#api-integration)
8. [Setup & Prerequisites](#setup--prerequisites)
9. [Development Guidelines](#development-guidelines)
10. [Deployment](#deployment)

## Overview

**MFD Trace Fish** is a comprehensive React Native mobile application designed for the Marine Fisheries Department (MFD) of Pakistan. The app facilitates fish traceability, trip management, and supply chain tracking across different stakeholders in the fishing industry.

### Key Information
- **App Name**: MFD Trace Fish
- **Version**: 0.0.1
- **Platform**: React Native (iOS & Android)
- **Target Audience**: Fishermen, Middlemen, Exporters, MFD Staff, FCS Personnel
- **Primary Language**: English with Urdu localization support

---

## Architecture

### Technology Stack
- **Framework**: React Native 0.80.2
- **Language**: TypeScript 5.0.4
- **State Management**: Redux with Redux Toolkit
- **Navigation**: React Navigation 7.x
- **UI Components**: React Native Paper
- **Storage**: AsyncStorage for offline data
- **HTTP Client**: Fetch API with custom wrapper
- **Internationalization**: i18next

### Project Structure
```
src/
├── app/
│   └── navigation/          # Navigation configuration
├── components/              # Reusable UI components
├── constants/               # App constants and dummy data
├── db/                      # Database repositories
├── i18n/                    # Internationalization setup
├── locales/                 # Translation files (en.json, ur.json)
├── offline/                 # Offline functionality
├── provider/                # Context providers
├── redux/                   # State management
├── screens/                 # Screen components
├── services/                # API services
├── theme/                   # UI theme and colors
└── utils/                   # Utility functions
```

---

## Features & Modules

### 1. Multi-Role Authentication System
- **User Types**: Fisherman, Middleman, Exporter, MFD Staff, FCS
- **Authentication**: JWT-based token authentication
- **Session Management**: Persistent login with token storage
- **Role-based Access**: Different UI and features per user role

### 2. Trip Management
- **Trip Creation**: Create new fishing trips with detailed information
- **Trip Tracking**: Real-time trip status updates
- **GPS Integration**: Location tracking and coordinates
- **Trip History**: Complete trip records and analytics

### 3. Fishing Activities
- **Activity Recording**: Record fishing activities with GPS coordinates
- **Equipment Details**: Track fishing gear and equipment
- **Species Recording**: Record fish species with lot numbers
- **Photo Capture**: Image capture for documentation

### 4. Boat Management
- **Boat Registration**: Register and manage fishing vessels
- **Boat Details**: Complete boat information and specifications
- **Maintenance Records**: Track boat maintenance and repairs

### 5. Supply Chain Management
- **Distributions**: Manage fish distributions
- **Purchases**: Track fish purchases and transactions
- **Assignments**: Manage fisherman assignments
- **Records**: Complete traceability records

### 6. Offline Functionality
- **Offline Data Entry**: Work without internet connection
- **Data Synchronization**: Automatic sync when online
- **Queue Management**: Intelligent offline queue system
- **Conflict Resolution**: Handle data conflicts during sync

---

## User Roles & Authentication

### User Types

#### 1. Fisherman
- **Primary Functions**: Trip management, fishing activities, boat registration
- **Key Features**: 
  - Create and manage fishing trips
  - Record fishing activities with GPS
  - Register and manage boats
  - Track fish species and lots
  - Offline data entry

#### 2. Middleman
- **Primary Functions**: Distribution management, purchase tracking
- **Key Features**:
  - Manage fish distributions
  - Track purchases and transactions
  - Handle assignments
  - View lot details

#### 3. Exporter
- **Primary Functions**: Export management, final product tracking
- **Key Features**:
  - Manage export operations
  - Track final products
  - View purchase records
  - Handle traceability forms

#### 4. MFD Staff
- **Primary Functions**: System administration, oversight
- **Key Features**:
  - View all system data
  - Manage distributions and purchases
  - Handle assignments
  - Access complete records

#### 5. FCS (Fisheries Control System)
- **Primary Functions**: Monitoring and control
- **Key Features**:
  - Monitor trips and distributions
  - Review pending approvals
  - Access control system data

### Authentication Flow
1. User enters credentials
2. System validates with backend API
3. JWT token received and stored
4. User role determined and mapped
5. Appropriate navigation stack loaded
6. Session persisted for future use

---

## Screens & UI Components

### Navigation Structure

#### Root Navigator
- **AuthStack**: Login and registration screens
- **Role-based Stacks**: Different navigation for each user role

#### Fisherman Stack
- **FishermanHome**: Dashboard with trip overview
- **AddTrip**: Trip creation and management
- **Trips**: Trip listing and history
- **Boats**: Boat management screens
- **Activities**: Fishing activity management
- **Profile**: User profile management

#### MFD Staff Stack
- **MFDStaffHome**: Administrative dashboard
- **DistributionsList**: Distribution management
- **PurchasesList**: Purchase tracking
- **RecordsList**: System records
- **BoatsList**: Boat management
- **AssignmentsList**: Assignment management

#### Middleman Stack
- **MiddleManHome**: Middleman dashboard
- **Distributions**: Distribution management
- **Purchases**: Purchase tracking
- **Assignments**: Assignment management

#### Exporter Stack
- **ExporterHome**: Exporter dashboard
- **AllTrips**: Trip viewing
- **PurchasesList**: Purchase management
- **FinalProducts**: Product management
- **TraceabilityForm**: Traceability records

#### FCS Stack
- **FCSHome**: FCS dashboard
- **TripsList**: Trip monitoring
- **DistributionsList**: Distribution monitoring

### UI Components

#### Common Components
- **BiText**: Bilingual text component
- **LanguageSwitcher**: Language toggle component
- **Bi**: Bilingual wrapper component

#### Screen Components
- **Dashboard Cards**: Role-specific dashboard cards
- **Action Tiles**: Quick action buttons
- **Management Modules**: Feature-specific modules
- **Status Indicators**: Online/offline status
- **Loading States**: Loading indicators and skeletons

---

## Offline Functionality

### Offline-First Architecture
The app implements a comprehensive offline-first solution allowing users to work without internet connectivity.

### Key Features
1. **Offline Data Entry**: Create trips, activities, and records offline
2. **Intelligent Queue System**: Automatic queuing of offline operations
3. **Dependency Resolution**: Proper handling of data dependencies
4. **Automatic Sync**: Background synchronization when online
5. **Conflict Resolution**: Handle data conflicts during sync

### Queue System
- **Job Types**: createTrip, startTrip, createActivity, createSpecies, completeActivity
- **Dependency Management**: Sequential processing with proper dependencies
- **Retry Logic**: Exponential backoff for failed operations
- **Persistent Storage**: AsyncStorage for queue persistence

### ID Generation
- **Trip IDs**: TRIP-YYYYMMDD-XXX format
- **Activity IDs**: ACT-YYYYMMDD-XXX format
- **Lot Numbers**: LOT-YYYYMMDD-XXX format
- **Local IDs**: LOCAL-TIMESTAMP-RANDOM for offline operations

---

## API Integration

### Base Configuration
- **Base URL**: https://smartaisoft.com/MFD-Trace-Fish/api
- **Authentication**: Bearer token in Authorization header
- **Content Type**: application/json
- **Error Handling**: Comprehensive error handling with offline detection

### Service Modules

#### Authentication Services
- `login()`: User authentication
- `logout()`: Session termination
- `loadSession()`: Session restoration

#### Trip Services
- `createTrip()`: Create new trip
- `startTrip()`: Start trip
- `fetchTrips()`: Get trip list
- `fetchTripById()`: Get trip details

#### Activity Services
- `createFishingActivity()`: Create activity
- `completeFishingActivity()`: Complete activity
- `fetchActivities()`: Get activity list

#### Species Services
- `createFishSpecies()`: Record fish species
- `fetchSpecies()`: Get species list

#### MFD Services
- `fetchMFDDistributions()`: Get distributions
- `fetchMFDPurchases()`: Get purchases
- `fetchMFDRecords()`: Get records
- `fetchMFDBoats()`: Get boats
- `fetchMFDAssignments()`: Get assignments

---

## Setup & Prerequisites

### System Requirements
- **Node.js**: >= 18.0.0
- **React Native CLI**: Latest version
- **Android Studio**: For Android development
- **Xcode**: For iOS development (macOS only)
- **CocoaPods**: For iOS dependencies

### Development Environment Setup

#### 1. Clone Repository
```bash
git clone <repository-url>
cd MFDTraceFish
```

#### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

#### 3. iOS Setup (macOS only)
```bash
cd ios
bundle install
bundle exec pod install
cd ..
```

#### 4. Android Setup
- Install Android Studio
- Configure Android SDK
- Set up Android emulator or connect device

### Environment Configuration

#### 1. API Configuration
Update `src/services/https.ts`:
```typescript
export const BASE_URL = 'https://your-api-endpoint.com/api';
```

#### 2. Build Configuration
- **Android**: Update `android/app/build.gradle`
- **iOS**: Update `ios/MFDTraceFish/Info.plist`

### Running the Application

#### Development Mode
```bash
# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

#### Production Build
```bash
# Android
cd android
./gradlew assembleRelease

# iOS
# Use Xcode to build and archive
```

---

## Development Guidelines

### Code Structure
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **Component Organization**: Feature-based organization

### State Management
- **Redux**: Centralized state management
- **Redux Thunk**: Async action handling
- **Redux Persist**: State persistence
- **Type Safety**: Full TypeScript integration

### UI/UX Guidelines
- **Material Design**: React Native Paper components
- **Consistent Theming**: Centralized color palette
- **Responsive Design**: Adaptive layouts
- **Accessibility**: Screen reader support

### Testing
- **Jest**: Unit testing framework
- **React Native Testing Library**: Component testing
- **Test Files**: Located in `__tests__/` directory

---

## Deployment

### Android Deployment

#### 1. Generate Release APK
```bash
cd android
./gradlew assembleRelease
```

#### 2. Sign APK (if not already signed)
```bash
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore your-release-key.keystore app-release-unsigned.apk alias_name
```

#### 3. Align APK
```bash
zipalign -v 4 app-release-unsigned.apk app-release.apk
```

### iOS Deployment

#### 1. Archive in Xcode
- Open `ios/MFDTraceFish.xcworkspace`
- Select "Any iOS Device" as target
- Product → Archive

#### 2. Upload to App Store
- Use Xcode Organizer
- Follow App Store Connect guidelines

### Environment-Specific Builds

#### Development
- Debug mode enabled
- API endpoints point to development server
- Logging enabled

#### Production
- Release mode
- API endpoints point to production server
- Logging minimized
- Code obfuscation enabled

---

## Security Considerations

### Data Protection
- **JWT Tokens**: Secure token storage
- **API Security**: HTTPS only communication
- **Data Encryption**: Sensitive data encryption
- **Input Validation**: Client and server-side validation

### Authentication Security
- **Token Expiration**: Automatic token refresh
- **Session Management**: Secure session handling
- **Role-based Access**: Proper authorization checks

---

## Performance Optimization

### App Performance
- **Lazy Loading**: Component lazy loading
- **Image Optimization**: Optimized image handling
- **Memory Management**: Proper cleanup and garbage collection
- **Bundle Size**: Optimized bundle size

### Network Optimization
- **Request Caching**: Intelligent caching strategy
- **Offline Support**: Reduced network dependency
- **Data Compression**: Compressed API responses

---

## Troubleshooting

### Common Issues

#### 1. Metro Bundler Issues
```bash
# Clear Metro cache
npx react-native start --reset-cache
```

#### 2. iOS Build Issues
```bash
# Clean and reinstall pods
cd ios
rm -rf Pods
rm Podfile.lock
bundle exec pod install
```

#### 3. Android Build Issues
```bash
# Clean Android build
cd android
./gradlew clean
```

#### 4. Network Issues
- Check API endpoint configuration
- Verify network connectivity
- Check authentication tokens

### Debug Information
- **Console Logging**: Enable debug logging in development
- **Network Monitoring**: Monitor API requests and responses
- **Error Tracking**: Comprehensive error logging

---

## Future Enhancements

### Planned Features
1. **Real-time Notifications**: Push notifications for updates
2. **Advanced Analytics**: Detailed reporting and analytics
3. **Multi-language Support**: Additional language support
4. **Offline Maps**: Offline map functionality
5. **Biometric Authentication**: Fingerprint/Face ID support

### Technical Improvements
1. **Performance Optimization**: Further performance improvements
2. **Code Splitting**: Dynamic imports for better performance
3. **Testing Coverage**: Increased test coverage
4. **Documentation**: Enhanced documentation and guides

---

## Support & Maintenance

### Development Team
- **Lead Developer**: [Name]
- **Backend Developer**: [Name]
- **UI/UX Designer**: [Name]
- **QA Engineer**: [Name]

### Contact Information
- **Email**: [support-email]
- **Phone**: [support-phone]
- **Documentation**: [docs-url]

### Version History
- **v0.0.1**: Initial release with core functionality
- **Future versions**: See changelog for updates

---

## Conclusion

The MFD Trace Fish mobile application represents a comprehensive solution for fish traceability and supply chain management in Pakistan's marine fisheries sector. With its robust offline functionality, multi-role support, and comprehensive feature set, it provides an essential tool for stakeholders across the fishing industry.

The application's architecture ensures scalability, maintainability, and reliability, while its user-friendly interface makes it accessible to users with varying technical expertise. The offline-first approach ensures that fishermen can continue their work even in areas with poor connectivity, making it a practical solution for real-world usage.

For technical support, feature requests, or bug reports, please contact the development team through the provided channels.

---

*This documentation is maintained by the MFD Trace Fish development team and is updated regularly to reflect the current state of the application.*
