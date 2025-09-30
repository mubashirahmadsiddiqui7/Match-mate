// App.tsx
import React from 'react';
import { Provider } from 'react-redux';
import { store } from './src/redux/store';
// import { GestureHandlerRootView } from 'react-native-gesture-handler';
import RootNavigator from './src/app/navigation/RootNavigator';
import AuthBootstrap from './src/provider/AuthBootstrap';
import QueueProvider from './src/offline/QueueProvider';
import Toast from 'react-native-toast-message';
// Initialize i18n
import './src/i18n';
import LanguageSwitcher from './src/components/LanguageSwitcher';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <AuthBootstrap>
          <QueueProvider>
            <RootNavigator />
            <LanguageSwitcher />
            <Toast />  {/* 👈 mount toast at root */}
          </QueueProvider>
        </AuthBootstrap>
      </SafeAreaProvider>
    </Provider>
  );
}
